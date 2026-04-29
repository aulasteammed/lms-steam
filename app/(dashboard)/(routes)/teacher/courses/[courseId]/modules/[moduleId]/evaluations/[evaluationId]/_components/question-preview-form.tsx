"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Answer, Question } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import {
    ACTIVE_QUESTION_TYPES,
    AppQuestionType,
    QUESTION_TYPE_LABELS,
    normalizeQuestionType,
} from "@/lib/evaluation";

type QuestionWithAnswers = Question & {
    type?: AppQuestionType | null;
    answers: Answer[];
};

interface QuestionsPreviewFormProps {
    questions: QuestionWithAnswers[];
    courseId: string;
    moduleId: string;
    evaluationId: string;
}

type EditableAnswer = {
    id?: string;
    title: string;
    isCorrect: boolean;
};

export const QuestionsPreviewForm = ({
    questions,
    courseId,
    moduleId,
    evaluationId,
}: QuestionsPreviewFormProps) => {
    const router = useRouter();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [questionType, setQuestionType] = useState<AppQuestionType>("single");
    const [answers, setAnswers] = useState<EditableAnswer[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const startEdit = (question: QuestionWithAnswers) => {
        const normalizedType = normalizeQuestionType(question.type, null);
        setEditingId(question.id);
        setTitle(question.title);
        setQuestionType(normalizedType);
        setAnswers(
            question.answers.map((answer) => ({
                id: answer.id,
                title: answer.title,
                isCorrect: normalizedType === "sequence" ? true : answer.isCorrect,
            }))
        );
    };

    const cancelEdit = () => {
        setEditingId(null);
        setTitle("");
        setQuestionType("single");
        setAnswers([]);
    };

    const updateAnswer = (index: number, payload: Partial<EditableAnswer>) => {
        const next = [...answers];
        next[index] = { ...next[index], ...payload };
        setAnswers(next);
    };

    const changeType = (type: AppQuestionType) => {
        setQuestionType(type);
        setAnswers((current) => {
            const base =
                current.length > 0
                    ? current.map((answer) => ({
                          ...answer,
                          isCorrect: type === "sequence" ? true : answer.isCorrect,
                      }))
                    : type === "open"
                      ? [{ title: "", isCorrect: true }]
                      : [
                            { title: "", isCorrect: type === "single" || type === "sequence" },
                            { title: "", isCorrect: type === "sequence" },
                        ];

            if (type === "open") {
                return [base[0] ?? { title: "", isCorrect: true }];
            }

            if (base.length < 2) {
                return [
                    base[0] ?? { title: "", isCorrect: type === "single" || type === "sequence" },
                    { title: "", isCorrect: type === "sequence" },
                ];
            }

            if (type === "single") {
                const firstCorrectIndex = base.findIndex((answer) => answer.isCorrect);
                return base.map((answer, index) => ({
                    ...answer,
                    isCorrect: index === (firstCorrectIndex >= 0 ? firstCorrectIndex : 0),
                }));
            }

            return base;
        });
    };

    const addAnswer = () => {
        if (questionType === "open") return;
        setAnswers([...answers, { title: "", isCorrect: questionType === "sequence" }]);
    };

    const removeAnswer = (index: number) => {
        const min = questionType === "open" ? 1 : 2;
        if (answers.length <= min) return;
        setAnswers(answers.filter((_, currentIndex) => currentIndex !== index));
    };

    const validate = () => {
        if (title.trim().length < 5) {
            return "La pregunta debe tener al menos 5 caracteres";
        }

        const validAnswers = answers.filter((answer) => answer.title.trim().length > 0);

        if (questionType === "open" && validAnswers.length < 1) {
            return "Debes definir la respuesta esperada";
        }

        if (questionType !== "open" && validAnswers.length < 2) {
            return "Debes definir al menos dos respuestas";
        }

        if (questionType === "single") {
            const correctCount = validAnswers.filter((answer) => answer.isCorrect).length;
            if (correctCount !== 1) {
                return "La selección única requiere exactamente una respuesta correcta";
            }
        }

        if (questionType === "multiple" && !validAnswers.some((answer) => answer.isCorrect)) {
            return "La selección múltiple requiere al menos una respuesta correcta";
        }

        return null;
    };

    const saveQuestion = async (questionId: string) => {
        const error = validate();
        if (error) {
            toast.error(error);
            return;
        }

        setIsSaving(true);

        try {
            await axios.patch(
                `/api/courses/${courseId}/modules/${moduleId}/evaluations/${evaluationId}/questions/${questionId}`,
                {
                    title: title.trim(),
                    type: questionType,
                    answers: answers
                        .filter((answer) => answer.title.trim().length > 0)
                        .map((answer) => ({
                            title: answer.title.trim(),
                            isCorrect: questionType === "sequence" ? true : answer.isCorrect,
                        })),
                }
            );

            toast.success("Pregunta actualizada");
            cancelEdit();
            router.refresh();
        } catch {
            toast.error("No se pudo actualizar la pregunta");
        } finally {
            setIsSaving(false);
        }
    };

    const deleteQuestion = async (questionId: string) => {
        if (!window.confirm("¿Quieres eliminar esta pregunta?")) {
            return;
        }

        setIsDeleting(questionId);

        try {
            await axios.delete(
                `/api/courses/${courseId}/modules/${moduleId}/evaluations/${evaluationId}/questions/${questionId}`
            );
            toast.success("Pregunta eliminada");
            if (editingId === questionId) {
                cancelEdit();
            }
            router.refresh();
        } catch {
            toast.error("No se pudo eliminar la pregunta");
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <div className="mt-6 border bg-slate-100 rounded-md p-4">
            <div className="font-medium flex items-center justify-between">
                Vista previa de la evaluación
                <Button className="invisible" variant="ghost">
                    Agregar
                </Button>
            </div>
            {questions.length === 0 ? (
                <p className="text-sm text-gray-500">Aún no se han agregado preguntas.</p>
            ) : (
                <ul className="space-y-2 mt-2">
                    {questions.map((q, idx) => (
                        <li key={q.id} className="border p-2 rounded bg-white text-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <span className="font-medium text-gray-800">
                                        Pregunta {idx + 1}:
                                    </span>{" "}
                                    {editingId === q.id ? title : q.title}
                                    <p className="text-xs text-slate-500 mt-1">
                                        Tipo: {QUESTION_TYPE_LABELS[normalizeQuestionType(q.type, null)]}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => startEdit(q)}>
                                        Editar
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        disabled={isDeleting === q.id}
                                        onClick={() => deleteQuestion(q.id)}
                                    >
                                        Eliminar
                                    </Button>
                                </div>
                            </div>

                            {editingId === q.id ? (
                                <div className="space-y-3 mt-3">
                                    <div>
                                        <label className="text-sm font-medium">Tipo de pregunta</label>
                                        <select
                                            className="w-full rounded-md border border-slate-200 p-2 text-sm mt-1"
                                            value={questionType}
                                            onChange={(event) => changeType(event.target.value as AppQuestionType)}
                                        >
                                            {ACTIVE_QUESTION_TYPES.map((type) => (
                                                <option key={type} value={type}>
                                                    {QUESTION_TYPE_LABELS[type]}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium">Enunciado</label>
                                        <Input
                                            className="mt-1"
                                            value={title}
                                            onChange={(event) => setTitle(event.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            {questionType === "sequence" ? "Pasos en orden correcto" : "Respuestas"}
                                        </label>

                                        {answers.map((answer, answerIdx) => (
                                            <div key={answer.id ?? answerIdx} className="flex items-center gap-2">
                                                <Input
                                                    value={answer.title}
                                                    onChange={(event) =>
                                                        updateAnswer(answerIdx, { title: event.target.value })
                                                    }
                                                    placeholder={
                                                        questionType === "sequence"
                                                            ? `Paso ${answerIdx + 1}`
                                                            : `Respuesta ${answerIdx + 1}`
                                                    }
                                                />

                                                {questionType === "single" && (
                                                    <div className="flex items-center gap-1 min-w-max">
                                                        <Checkbox
                                                            checked={answer.isCorrect}
                                                            onCheckedChange={(checked) => {
                                                                const checkedValue = checked === true;
                                                                setAnswers(
                                                                    answers.map((item, currentIndex) => ({
                                                                        ...item,
                                                                        isCorrect:
                                                                            currentIndex === answerIdx ? checkedValue : false,
                                                                    }))
                                                                );
                                                            }}
                                                        />
                                                        <span className="text-xs">Correcta</span>
                                                    </div>
                                                )}

                                                {questionType === "multiple" && (
                                                    <div className="flex items-center gap-1 min-w-max">
                                                        <Checkbox
                                                            checked={answer.isCorrect}
                                                            onCheckedChange={(checked) =>
                                                                updateAnswer(answerIdx, {
                                                                    isCorrect: checked === true,
                                                                })
                                                            }
                                                        />
                                                        <span className="text-xs">Correcta</span>
                                                    </div>
                                                )}

                                                {questionType !== "open" && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeAnswer(answerIdx)}
                                                    >
                                                        Quitar
                                                    </Button>
                                                )}
                                            </div>
                                        ))}

                                        {questionType !== "open" && (
                                            <Button type="button" variant="outline" size="sm" onClick={addAnswer}>
                                                {questionType === "sequence" ? "Añadir paso" : "Añadir respuesta"}
                                            </Button>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <Button disabled={isSaving} onClick={() => saveQuestion(q.id)}>
                                            Guardar cambios
                                        </Button>
                                        <Button variant="ghost" onClick={cancelEdit}>
                                            Cancelar
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <ul className="mt-1 space-y-1">
                                    {q.answers.map((a, answerIdx) => (
                                        <li
                                            key={a.id}
                                            className={`flex items-start gap-2 ${
                                                a.isCorrect ? "text-sky-700 font-medium" : ""
                                            }`}
                                        >
                                            <span className="font-semibold">
                                                {normalizeQuestionType(q.type, null) === "sequence"
                                                    ? `${answerIdx + 1}.`
                                                    : `${String.fromCharCode(97 + answerIdx)}.`}
                                            </span>
                                            <span>{a.title}{a.isCorrect && normalizeQuestionType(q.type, null) !== "sequence" ? " (Correcta)" : ""}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>

            )}
        </div>
    );
};
