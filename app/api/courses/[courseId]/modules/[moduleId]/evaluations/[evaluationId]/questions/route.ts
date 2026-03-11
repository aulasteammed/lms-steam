import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { QuestionType } from "@prisma/client";

export async function POST(
    req: Request,
    props: {
        params: Promise<{ evaluationId: string }>;
    }
) {
    try {
        const params = await props.params;
        const { userId } = await auth();
        const { title, answers, type } = await req.json();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const evaluationOwner = await db.evaluation.findUnique({
            where: {
                id: params.evaluationId,
            },
        });

        if (!evaluationOwner) {
            return new NextResponse("Evaluation not found", { status: 404 });
        }

        if (!Object.values(QuestionType).includes(type)) {
            return new NextResponse("Tipo de pregunta inválido", { status: 400 });
        }

        if (!title || !Array.isArray(answers) || answers.length === 0) {
            return new NextResponse("Datos de pregunta inválidos", { status: 400 });
        }

        const questionWithAnswers = await db.question.create({
            data: {
                title,
                type,
                evaluation: { connect: { id: params.evaluationId } },
                answers: {
                    create: answers.map((answer: { title: string; isCorrect: boolean }) => ({
                        title: answer.title,
                        isCorrect: type === "sequence" ? true : answer.isCorrect,
                    })),
                },
            },
            include: {
                answers: true,
            },
        });

        return NextResponse.json(questionWithAnswers);
    } catch (error) {
        console.error("[CREATE_QUESTION]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
