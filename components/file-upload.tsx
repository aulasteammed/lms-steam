"use client";

import toast from "react-hot-toast";
import { UploadDropzone } from '@/lib/uploadthing';
import { ourFileRouter } from "@/app/api/uploadthing/core";


interface FileUploadProps {
  action: (url?: string) => void;
  endpoint: keyof typeof ourFileRouter;
  previousFileKey?: string;
}

export const FileUpload = ({ action, endpoint, previousFileKey }: FileUploadProps) => {
    return (
        <UploadDropzone
            endpoint={endpoint}
            input={{ previousFileKey }}
            onClientUploadComplete={(res) => {
                action(res?.[0].url);
            }}
            onUploadError={(error: Error) => {
                toast.error(`${error?.message}`);
            }}
        />
    );
};