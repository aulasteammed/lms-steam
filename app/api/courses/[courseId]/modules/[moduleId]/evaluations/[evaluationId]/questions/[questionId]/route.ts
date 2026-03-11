import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { QuestionType } from "@prisma/client";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { normalizeQuestionType } from "@/lib/evaluation";

const validateAnswers = (
  type: QuestionType,
  answers: Array<{ title: string; isCorrect: boolean }>
) => {
  if (!Array.isArray(answers) || answers.length === 0) {
    return "Debes enviar respuestas";
  }

  const validAnswers = answers.filter((answer) => answer.title?.trim().length > 0);

  if (validAnswers.length === 0) {
    return "Debes enviar al menos una respuesta válida";
  }

  if (type === "single") {
    if (validAnswers.length < 2) return "Single requiere al menos dos opciones";
    const correct = validAnswers.filter((answer) => answer.isCorrect).length;
    if (correct !== 1) return "Single requiere exactamente una opción correcta";
  }

  if (type === "multiple") {
    if (validAnswers.length < 2) return "Multiple requiere al menos dos opciones";
    const hasCorrect = validAnswers.some((answer) => answer.isCorrect);
    if (!hasCorrect) return "Multiple requiere al menos una opción correcta";
  }

  if (type === "open") {
    const hasCorrect = validAnswers.some((answer) => answer.isCorrect);
    if (!hasCorrect) return "Open requiere una respuesta esperada";
  }

  if (type === "sequence") {
    if (validAnswers.length < 2) return "Sequence requiere al menos dos pasos";
  }

  return null;
};

const resetEvaluationAttempts = async (
  tx: Prisma.TransactionClient,
  evaluationId: string
) => {
  const results = await tx.evaluationResult.findMany({
    where: { evaluationId },
    select: { id: true },
  });

  const resultIds = results.map((result) => result.id);

  if (resultIds.length > 0) {
    await tx.selectedAnswer.deleteMany({
      where: {
        evaluationResultId: { in: resultIds },
      },
    });

    await tx.evaluationResult.deleteMany({
      where: {
        id: { in: resultIds },
      },
    });
  }
};

export async function PATCH(
  req: Request,
  props: {
    params: Promise<{
      courseId: string;
      moduleId: string;
      evaluationId: string;
      questionId: string;
    }>;
  }
) {
  try {
    const params = await props.params;
    const { userId } = await auth();
    const { title, answers, type } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId,
      },
      select: { id: true },
    });

    if (!course) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!Object.values(QuestionType).includes(type)) {
      return new NextResponse("Tipo de pregunta inválido", { status: 400 });
    }

    if (!title || typeof title !== "string" || title.trim().length < 5) {
      return new NextResponse("El enunciado debe tener al menos 5 caracteres", { status: 400 });
    }

    const normalizedAnswers = (Array.isArray(answers) ? answers : []).map(
      (answer: { title: string; isCorrect: boolean }) => ({
        title: String(answer.title ?? "").trim(),
        isCorrect: type === "sequence" ? true : Boolean(answer.isCorrect),
      })
    );

    const validationError = validateAnswers(type, normalizedAnswers);
    if (validationError) {
      return new NextResponse(validationError, { status: 400 });
    }

    const question = await db.question.findUnique({
      where: { id: params.questionId },
      include: {
        evaluation: {
          select: {
            id: true,
            moduleId: true,
            module: {
              select: {
                id: true,
                courseId: true,
              },
            },
          },
        },
      },
    });

    if (
      !question ||
      question.evaluationId !== params.evaluationId ||
      question.evaluation.moduleId !== params.moduleId ||
      question.evaluation.module.courseId !== params.courseId
    ) {
      return new NextResponse("Pregunta no encontrada", { status: 404 });
    }

    await db.$transaction(async (tx) => {
      await tx.answer.deleteMany({
        where: { questionId: params.questionId },
      });

      const updatedQuestion = await tx.question.update({
        where: { id: params.questionId },
        data: {
          title: title.trim(),
          type,
        },
      });

      await tx.answer.createMany({
        data: normalizedAnswers
          .filter((answer) => answer.title.length > 0)
          .map((answer) => ({
            title: answer.title,
            isCorrect: answer.isCorrect,
            questionId: params.questionId,
          })),
      });

      await tx.evaluation.update({
        where: { id: params.evaluationId },
        data: { isPublished: false },
      });

      await tx.module.update({
        where: { id: params.moduleId },
        data: { isPublished: false },
      });

      const publishedModules = await tx.module.findMany({
        where: {
          courseId: params.courseId,
          isPublished: true,
        },
        select: { id: true },
      });

      if (publishedModules.length === 0) {
        await tx.course.update({
          where: { id: params.courseId },
          data: { isPublished: false },
        });
      }

      await resetEvaluationAttempts(tx, params.evaluationId);

      return updatedQuestion;
    });

    const updated = await db.question.findUnique({
      where: { id: params.questionId },
      include: { answers: true, evaluation: true },
    });

    return NextResponse.json({
      ...updated,
      type: normalizeQuestionType(updated?.type, null),
    });
  } catch (error) {
    console.error("[QUESTION_PATCH]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  props: {
    params: Promise<{
      courseId: string;
      moduleId: string;
      evaluationId: string;
      questionId: string;
    }>;
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
        userId,
      },
      select: { id: true },
    });

    if (!course) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const question = await db.question.findUnique({
      where: { id: params.questionId },
      include: {
        evaluation: {
          include: {
            module: {
              select: {
                courseId: true,
              },
            },
          },
        },
      },
    });

    if (
      !question ||
      question.evaluationId !== params.evaluationId ||
      question.evaluation.moduleId !== params.moduleId ||
      question.evaluation.module.courseId !== params.courseId
    ) {
      return new NextResponse("Pregunta no encontrada", { status: 404 });
    }

    await db.$transaction(async (tx) => {
      await tx.selectedAnswer.deleteMany({
        where: { questionId: params.questionId },
      });

      await tx.answer.deleteMany({
        where: { questionId: params.questionId },
      });

      await tx.question.delete({
        where: { id: params.questionId },
      });

      await tx.evaluation.update({
        where: { id: params.evaluationId },
        data: { isPublished: false },
      });

      await tx.module.update({
        where: { id: params.moduleId },
        data: { isPublished: false },
      });

      const publishedModules = await tx.module.findMany({
        where: {
          courseId: params.courseId,
          isPublished: true,
        },
        select: { id: true },
      });

      if (publishedModules.length === 0) {
        await tx.course.update({
          where: { id: params.courseId },
          data: { isPublished: false },
        });
      }

      await resetEvaluationAttempts(tx, params.evaluationId);
    });

    return new NextResponse("Pregunta eliminada correctamente", { status: 200 });
  } catch (error) {
    console.error("[QUESTION_DELETE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
