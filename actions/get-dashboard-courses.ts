import { Category, Module, Course, CourseCategory } from '@prisma/client';

import { db } from '@/lib/db';
import { getProgressBatch } from '@/actions/get-progress-batch';

type CourseWithProgressWithCategory = Pick<Course, "id" | "title" | "imageUrl" | "level" | "createdAt"> & {
    courseCategories: (CourseCategory & {
        category: Pick<Category, "name">;
    })[];
    modules: Pick<Module, "id">[];
    progress: number | null;
};

type DashboardCourses = {
    completedCourses: CourseWithProgressWithCategory[];
    coursesInProgress: CourseWithProgressWithCategory[];
};

export const getDashboardCourses = async (
    userId: string
): Promise<DashboardCourses> => {
    try {
        const registeredCourses = await db.registration.findMany({
            where: {
                userId,
            },
            select: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        imageUrl: true,
                        level: true,
                        createdAt: true,
                        courseCategories: {
                            select: {
                                category: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                        },
                        modules: {
                            where: {
                                isPublished: true,
                            },
                            select: {
                                id: true,
                            },
                        },
                    },
                },
            },
        });

        const courses = registeredCourses.map(
            (r) => r.course
        ) as CourseWithProgressWithCategory[];

        const courseIds = courses.map(course => course.id);

        // Get progress in batch
        const progressMap = await getProgressBatch(userId, courseIds);

        // Assign progress to each course
        const coursesWithProgress = courses.map(course => ({
            ...course,
            progress: progressMap[course.id] ?? null,
        }));

        const completedCourses = coursesWithProgress.filter(
            (course) => course.progress === 100
        );

        const coursesInProgress = coursesWithProgress.filter(
            (course) => (course.progress ?? 0) < 100
        );

        return {
            completedCourses,
            coursesInProgress,
        };
    } catch (error) {
        console.log('[GET_DASHBOARD_COURSES]', error);
        return {
            completedCourses: [],
            coursesInProgress: [],
        };
    }
};
