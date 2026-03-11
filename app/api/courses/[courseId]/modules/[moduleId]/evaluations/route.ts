import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function POST(
  req: Request,
  props: {
    params: Promise<{ moduleId: string }>;
  }
) {
  try {
    const params = await props.params;
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const module = await db.module.findUnique({
      where: { id: params.moduleId },
      select: { id: true },
    });

    if (!module) {
      return new NextResponse("Módulo no encontrado", { status: 404 });
    }

    const existingEvaluation = await db.evaluation.findFirst({
      where: { moduleId: params.moduleId },
    });

    const evaluation =
      existingEvaluation ??
      (await db.evaluation.create({
        data: { moduleId: params.moduleId },
      }));

    await db.module.update({
      where: { id: params.moduleId },
      data: {
        isEvaluable: true,
        evaluationMethod: null,
      },
    });

    return NextResponse.json(evaluation);
  } catch (error) {
    console.log("[EVALUATIONS]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
