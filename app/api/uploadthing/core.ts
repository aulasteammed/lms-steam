import { auth } from "@clerk/nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";
import { isTeacher } from '@/lib/teacher';
import { z } from "zod";
/**
 * Centralized Authentication and File Upload Routes for Course Resources.
 */
const f = createUploadthing();
const utapi = new UTApi();


// Extract fileKey from UploadThing's URL
const extractFileKey = (url: string): string => {
    return url.split("/f/")[1];
}

// Detele previously file
const deletePreviousFile = async (previousFileKey?: string) => {
    if (!previousFileKey) return;
    try {
        await utapi.deleteFiles(previousFileKey);
        console.log("Deleted previous file:", previousFileKey);
    } catch (error) {
        console.error("Failed to delete previous file:", previousFileKey, error);
    }
}


// Centralized Authentication Function.
const handleAuth = async (req: Request) => {
    const { userId } = await auth();

    if (!userId || !isTeacher(userId)) {
        throw new UploadThingError("Unauthorized");
    }

    return { userId };
};

// Defines File Upload Routes for Course Resources.
export const ourFileRouter = {
    // Route for course images
    courseImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
        .input(z.object({ previousFileKey: z.string().optional() })) 
        .middleware(async ({ req, input }) => {
            const userId = await handleAuth(req);
            return { userId, previousFileKey: input?.previousFileKey };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            await deletePreviousFile(metadata.previousFileKey);
            console.log("Upload complete for userId:", metadata.userId);
            console.log("File URL:", file.ufsUrl);

        }),

    // Route for course attachments (multiple file types allowed)
    courseAttachment: f(["text", "image", "video", "audio", "pdf"])
        .input(z.object({ previousFileKey: z.string().optional() })) 
        .middleware(async ({ req, input }) => {
            const userId = await handleAuth(req);
            return { userId, previousFileKey: input?.previousFileKey };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            await deletePreviousFile(metadata.previousFileKey);
            console.log("Upload complete for userId:", metadata.userId);
            console.log("File URL:", file.ufsUrl);
        }),

    // Route for module videos
    moduleVideo: f({ video: { maxFileSize: "512GB", maxFileCount: 1 } })
        .input(z.object({ previousFileKey: z.string().optional() }))
        .middleware(async ({ req, input }) => {
            const userId = await handleAuth(req);
            return { userId, previousFileKey: input?.previousFileKey };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            await deletePreviousFile(metadata.previousFileKey);
            console.log("Upload complete for userId:", metadata.userId);
            console.log("File URL:", file.ufsUrl);
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

