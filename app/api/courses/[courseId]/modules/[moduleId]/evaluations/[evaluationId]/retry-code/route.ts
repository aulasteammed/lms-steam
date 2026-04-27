import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
  getAllowedAttempts,
  getOrCreateActiveRetryCode,
  rotateRetryCode,
} from "@/lib/evaluation-retry";

export async function POST(
  req: Request,
  props: {
    params: Promise<{ evaluationId: string }>;
  }
) {
  try {
    const { evaluationId } = await props.params;
    const { userId } = await auth();

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json().catch(() => ({}));
    const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";

    if (!code) {
      return new NextResponse("Debes ingresar un código", { status: 400 });
    }

    const evaluation = await db.evaluation.findUnique({
      where: { id: evaluationId },
      select: { id: true, maxAttempts: true },
    });

    if (!evaluation) {
      return new NextResponse("Evaluación no encontrada", { status: 404 });
    }

    const baseMaxAttempts = evaluation.maxAttempts ?? 0;

    const [attemptsCount, bestResult] = await Promise.all([
      db.evaluationResult.count({
        where: { userId, evaluationId },
      }),
      db.evaluationResult.findFirst({
        where: { userId, evaluationId },
        orderBy: { score: "desc" },
        select: { score: true },
      }),
    ]);

    if ((bestResult?.score ?? 0) >= 80) {
      return new NextResponse("Ya aprobaste esta evaluación", { status: 400 });
    }

    const allowedAttempts = await getAllowedAttempts(
      userId,
      evaluationId,
      baseMaxAttempts
    );

    if (attemptsCount < allowedAttempts) {
      return new NextResponse(
        "Aún tienes intentos disponibles. Usa el código cuando se agoten.",
        { status: 400 }
      );
    }

    const redeemed = await db.$transaction(async (tx) => {
      const txAny = tx as any;
      const activeCode = await getOrCreateActiveRetryCode(txAny);

      if (activeCode.code !== code) {
        return { ok: false as const, status: 400, message: "Código inválido" };
      }

      const disabled = await txAny.retryAccessCode.updateMany({
        where: {
          id: activeCode.id,
          code,
          isActive: true,
        },
        data: {
          isActive: false,
          usedByUserId: userId,
          usedForEvaluationId: evaluationId,
          usedAt: new Date(),
        },
      });

      if (disabled.count !== 1) {
        return {
          ok: false as const,
          status: 409,
          message: "El código ya fue usado. Solicita uno nuevo en aula STEAM.",
        };
      }

      await txAny.evaluationRetryGrant.create({
        data: {
          userId,
          evaluationId,
          extraAttempts: 2,
          codeUsed: code,
        },
      });

      const newCode = await rotateRetryCode(txAny);

      return {
        ok: true as const,
        newCode: newCode.code,
      };
    });

    if (!redeemed.ok) {
      return new NextResponse(redeemed.message, { status: redeemed.status });
    }

    return NextResponse.json({
      success: true,
      message: "Código aplicado. Se habilitaron 2 intentos adicionales.",
    });
  } catch (error) {
    console.error("[EVALUATION_RETRY_CODE_REDEEM_ERROR]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
