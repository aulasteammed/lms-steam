import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

/**
 * DELETE Request Handler for Deleting a Course and its Related Data.
 *
 * This function handles DELETE requests to remove a course from the database.
 */
export async function DELETE(
    req: Request,
    props: {
      params: Promise<{ courseId: string }>;
    }
) {
  try {
    const params = await props.params;
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: userId,
      },
      include: {
        modules: true
      },
    });

    if (!course) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const moduleIds = course.modules.map((m) => m.id);

    // Get all evaluations for these modules
    const evaluations = await db.evaluation.findMany({
      where: { moduleId: { in: moduleIds } },
      select: { id: true },
    });
    const evaluationIds = evaluations.map((e) => e.id);

    // Get all questions for these evaluations
    const questions = await db.question.findMany({
      where: { evaluationId: { in: evaluationIds } },
      select: { id: true },
    });
    const questionIds = questions.map((q) => q.id);

    // Delete in dependency order
    await db.selectedAnswer.deleteMany({ where: { questionId: { in: questionIds } } });
    await db.evaluationResult.deleteMany({ where: { evaluationId: { in: evaluationIds } } });
    await db.answer.deleteMany({ where: { questionId: { in: questionIds } } });
    await db.question.deleteMany({ where: { evaluationId: { in: evaluationIds } } });
    await db.evaluation.deleteMany({ where: { moduleId: { in: moduleIds } } });
    await db.userProgress.deleteMany({ where: { moduleId: { in: moduleIds } } });
    await db.module.deleteMany({ where: { courseId: params.courseId } });
    await db.attachment.deleteMany({ where: { courseId: params.courseId } });
    await db.registration.deleteMany({ where: { courseId: params.courseId } });
    await db.certificate.deleteMany({ where: { courseId: params.courseId } });
    await db.rating.deleteMany({ where: { courseId: params.courseId } });

    // Finally, delete the course itself
    const deletedCourse = await db.course.delete({
      where: {
        id: params.courseId,
      },
    });

    return NextResponse.json(deletedCourse);
  } catch (error) {
    console.log("[COURSE_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

/**
 * PATCH Request Handler for Updating a Course.
 *
 * This function handles PATCH requests to update a course's details.
 */
export async function PATCH(
    req: Request,
    props: {
      params: Promise<{ courseId: string }>;
    }
) {
  try {
    const params = await props.params;
    const { userId } = await auth();
    const values = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const course = await db.course.update({
      where: {
        id: params.courseId,
        userId,
      },
      data: {
        ...values,
      },
    });

    return NextResponse.json(course);
  } catch (error) {
    console.log("[COURSE_ID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
