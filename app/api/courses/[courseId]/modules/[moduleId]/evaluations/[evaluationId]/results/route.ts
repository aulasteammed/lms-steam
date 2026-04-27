import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { sendExhaustedAttemptsEmail } from "@/lib/evaluation-email";
import { getAllowedAttempts } from "@/lib/evaluation-retry";

export async function POST(
  req: Request,
  props: {
    params: Promise<{ courseId: string; moduleId: string; evaluationId: string }>;
  }
) {
  try {
    const { evaluationId } = await props.params;
    const { userId } = await auth();

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { selectedAnswers, score } = await req.json();

    if (!Array.isArray(selectedAnswers) || typeof score !== "number") {
      return new NextResponse("Datos inválidos", { status: 400 });
    }

    const evaluation = await db.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        module: {
          include: {
            course: {
              select: { title: true },
            },
          },
        },
      },
    });

    if (!evaluation) {
      return new NextResponse("Evaluación no encontrada", { status: 404 });
    }

    const maxAttempts = evaluation.maxAttempts ?? 0;

    const previousAttempts = await db.evaluationResult.count({
      where: { userId, evaluationId },
    });

    const allowedAttempts = await getAllowedAttempts(
      userId,
      evaluationId,
      maxAttempts
    );

    if (previousAttempts >= allowedAttempts) {
      return new NextResponse("No tienes intentos disponibles", { status: 403 });
    }

    const attempt = previousAttempts + 1;

    const evaluationResult = await db.$transaction(async (tx) => {
      const result = await tx.evaluationResult.create({
        data: {
          userId,
          evaluationId,
          attempt,
          score,
          completedAt: new Date(),
        },
      });

      await tx.selectedAnswer.createMany({
        data: selectedAnswers.map((answer: any) => ({
          title: answer.title,
          questionId: answer.questionId,
          isCorrect: answer.isCorrect,
          evaluationResultId: result.id,
        })),
      });

      return result;
    });

    const exhaustedAttempts = score < 80 && attempt >= allowedAttempts;

    if (exhaustedAttempts) {
      const previousNotification = await (db as any).evaluationRetryEmailLog.findUnique({
        where: {
          userId_evaluationId_attempt: {
            userId,
            evaluationId,
            attempt,
          },
        },
      });

      if (!previousNotification) {
        try {
          const clerk = await clerkClient();
          const user = await clerk.users.getUser(userId);
          const to = user.emailAddresses[0]?.emailAddress;

          if (to) {
            const emailResult = await sendExhaustedAttemptsEmail({
              to,
              studentName: [user.firstName, user.lastName].filter(Boolean).join(" "),
              courseTitle: evaluation.module.course.title,
              moduleTitle: evaluation.module.title,
            });

            if (emailResult.sent) {
              await (db as any).evaluationRetryEmailLog.create({
                data: {
                  userId,
                  evaluationId,
                  attempt,
                },
              });
            }
          }
        } catch (emailError) {
          console.error("[EVALUATION_RETRY_EMAIL_ERROR]", emailError);
        }
      }
    }

    return NextResponse.json(evaluationResult);
  } catch (error) {
    console.error("[EVALUATION_RESULT_ERROR]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
