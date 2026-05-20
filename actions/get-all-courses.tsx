import { Category, Course, CourseCategory } from '@prisma/client';

import { db } from '@/lib/db';

type CourseWithCategory = Pick<Course, "id" | "title" | "imageUrl" | "level" | "createdAt"> & {
    courseCategories: (CourseCategory & {
        category: Pick<Category, "name">;
    })[];
    modules: { id: string }[];
};

type GetCourses = {
    title?: string;
    categoryId?: string;
}

export const getAllCourses = async ({
                                        title,
                                        categoryId
                                    }: GetCourses): Promise<CourseWithCategory[]> => {
    try {
        return await db.course.findMany({
            where: {
                isPublished: true,
                title: {
                    contains: title,
                },
                ...(categoryId
                    ? {
                        courseCategories: {
                            some: {
                                categoryId,
                            },
                        },
                    }
                    : {}),
            },
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
                    }
                },
            },
            orderBy: {
                createdAt: "desc",
            }
        });
    } catch (error) {
        console.log("[GET_COURSES]", error);
        return [];
    }
}
