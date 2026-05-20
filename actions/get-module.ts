import { db } from '@/lib/db';
import { Attachment, Module } from '@prisma/client';

interface GetModuleProps {
    userId: string;
    moduleId: string;
    courseId: string;
    evaluationId: string;
}

export const getModule = async ({
                                     evaluationId,
                                     moduleId,
                                     courseId,
                                     userId,
                                 }: GetModuleProps) => {
    try {
        const registration = await db.registration.findFirst({
            where: {
                AND: [
                    { userId: userId },
                    { courseId: courseId },
                ],
            },
        });

        const course = await db.course.findUnique({
            where: {
                id: courseId,
                isPublished: true,
            },
        });

        const courseModule = await db.module.findUnique({
            where: {
                id: moduleId,
                isPublished: true,
            },
        });

        const evaluation = await db.evaluation.findUnique({
            where: {
                id: evaluationId,
                isPublished: true,
                moduleId: moduleId,
            },
        });

        if (!courseModule || !course || !evaluation) {
            throw new Error('Module, evaluation or course not found');
        }

        let attachments: Attachment[] = [];
        let nextModule: Module | null = null;

        if (registration) {
            attachments = await db.attachment.findMany({
                where: {
                    courseId,
                },
            });
        }

        if (courseModule.isEnabled || registration) {
            nextModule = await db.module.findFirst({
                where: {
                    courseId,
                    isPublished: true,
                    position: {
                        gt: courseModule.position,
                    },
                },
                orderBy: {
                    position: 'asc',
                },
            });
        }
        const userProgress = await db.userProgress.findFirst({
            where: {
                AND: [
                    { userId: userId },
                    { moduleId: moduleId },
                ],
            },
        });

        return {
            evaluation,
            module: courseModule,
            course,
            attachments,
            nextModule,
            userProgress,
            registration,
        };
    } catch (error) {
        console.log('[GET_MODULE_ERROR]', error);
        return {
            evaluation: null,
            module: null,
            course: null,
            attachments: [],
            nextModule: null,
            userProgress: null,
            registration: null,
        };
    }
};
