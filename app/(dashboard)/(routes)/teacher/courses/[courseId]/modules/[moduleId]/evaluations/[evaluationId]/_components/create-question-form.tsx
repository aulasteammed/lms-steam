"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ACTIVE_QUESTION_TYPES, AppQuestionType, QUESTION_TYPE_LABELS } from "@/lib/evaluation";

type AnswerDraft = {
    title: string;
    isCorrect: boolean;
};

interface CreateQuestionFormProps {
    courseId: string;
    moduleId: string;
    evaluationId: string;
}

const defaultAnswersByType = (type: AppQuestionType): AnswerDraft[] => {
    if (type === "open") {
        return [{ title: "", isCorrect: true }];
    }

    if (type === "sequence") {
        return [
            { title: "", isCorrect: true },
            { title: "", isCorrect: true },
        ];
    }

    if (type === "single") {
        return [
            { title: "", isCorrect: true },
            { title: "", isCorrect: false },
        ];
    }

    return [
        { title: "", isCorrect: false },
        { title: "", isCorrect: false },
    ];
};

export const CreateQuestionForm = ({
    courseId,
    moduleId,
    evaluationId,
}: CreateQuestionFormProps) => {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [questionTitle, setQuestionTitle] = useState("");
    const [questionType, setQuestionType] = useState<AppQuestionType>("single");
    const [answers, setAnswers] = useState<AnswerDraft[]>(defaultAnswersByType("single"));

    const resetForm = () => {
        setQuestionTitle("");
        setQuestionType("single");
        setAnswers(defaultAnswersByType("single"));
    };

    const changeType = (type: AppQuestionType) => {
        setQuestionType(type);
        setAnswers(defaultAnswersByType(type));
    };

    const updateAnswer = (index: number, payload: Partial<AnswerDraft>) => {
        const next = [...answers];
        next[index] = { ...next[index], ...payload };
        setAnswers(next);
    };

    const addAnswer = () => {
        if (questionType === "open") return;
        setAnswers([...answers, { title: "", isCorrect: questionType === "sequence" }]);
    };

    const removeAnswer = (index: number) => {
        const min = questionType === "open" ? 1 : 2;
        if (answers.length <= min) return;
        setAnswers(answers.filter((_, i) => i !== index));
    };

    const validate = () => {
        if (questionTitle.trim().length < 5) {
            return "La pregunta debe tener al menos 5 caracteres";
        }

        const validAnswers = answers.filter((answer) => answer.title.trim().length > 0);

        if (questionType !== "open" && validAnswers.length < 2) {
            return "Debes ingresar al menos dos opciones o pasos";
        }

        if (questionType === "open" && validAnswers.length < 1) {
            return "Debes ingresar la respuesta esperada";
        }

        if (questionType === "single") {
            const correctCount = validAnswers.filter((answer) => answer.isCorrect).length;
            if (correctCount !== 1) return "Single requiere exactamente una opcion correcta";
        }

        if (questionType === "multiple") {
            const hasCorrect = validAnswers.some((answer) => answer.isCorrect);
            if (!hasCorrect) return "Multiple requiere al menos una opcion correcta";
        }

        return null;
    };

    const onSubmit = async () => {
        const error = validate();
        if (error) {
            toast.error(error);
            return;
        }

        setIsSubmitting(true);

        try {
            const normalizedAnswers = answers
                .filter((answer) => answer.title.trim().length > 0)
                .map((answer) => ({
                    title: answer.title.trim(),
                    isCorrect: questionType === "sequence" ? true : answer.isCorrect,
                }));

            await axios.post(
                `/api/courses/${courseId}/modules/${moduleId}/evaluations/${evaluationId}/questions`,
                {
                    type: questionType,
                    title: questionTitle.trim(),
                    answers: normalizedAnswers,
                }
            );

            toast.success("Pregunta agregada");
            resetForm();
            setIsCreating(false);
            router.refresh();
        } catch {
            toast.error("No se pudo guardar la pregunta");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mt-6 border bg-slate-100 rounded-md p-4">
            <div className="font-medium flex items-center justify-between">
                Preguntas de la evaluacion
                <Button onClick={() => setIsCreating((current) => !current)} variant="ghost">
                    {isCreating ? "Cancelar" : "Anadir pregunta"}
                </Button>
            </div>

            {isCreating && (
                <div className="space-y-4 mt-4">
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
                            placeholder="Escribe el enunciado de la pregunta"
                            value={questionTitle}
                            onChange={(event) => setQuestionTitle(event.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            {questionType === "sequence" ? "Pasos en orden correcto" : "Respuestas"}
                        </label>

                        {answers.map((answer, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Input
                                    value={answer.title}
                                    onChange={(event) => updateAnswer(index, { title: event.target.value })}
                                    placeholder={
                                        questionType === "sequence" ? `Paso ${index + 1}` : `Respuesta ${index + 1}`
                                    }
                                />

                                {questionType === "single" && (
                                    <div className="flex items-center gap-1 min-w-max">
                                        <Checkbox
                                            checked={answer.isCorrect}
                                            onCheckedChange={(checked) => {
                                                const checkedValue = checked === true;
                                                const normalized = answers.map((item, i) => ({
                                                    ...item,
                                                    isCorrect: i === index ? checkedValue : false,
                                                }));
                                                setAnswers(normalized);
                                            }}
                                        />
                                        <span className="text-xs">Correcta</span>
                                    </div>
                                )}

                                {questionType === "multiple" && (
                                    <div className="flex items-center gap-1 min-w-max">
                                        <Checkbox
                                            checked={answer.isCorrect}
                                            onCheckedChange={(checked) => updateAnswer(index, { isCorrect: checked === true })}
                                        />
                                        <span className="text-xs">Correcta</span>
                                    </div>
                                )}

                                {questionType !== "open" && (
                                    <Button type="button" variant="ghost" size="sm" onClick={() => removeAnswer(index)}>
                                        Quitar
                                    </Button>
                                )}
                            </div>
                        ))}

                        {questionType !== "open" && (
                            <Button type="button" variant="outline" size="sm" onClick={addAnswer}>
                                {questionType === "sequence" ? "Anadir paso" : "Anadir respuesta"}
                            </Button>
                        )}
                    </div>

                    <Button onClick={onSubmit} disabled={isSubmitting}>
                        Guardar pregunta
                    </Button>
                </div>
            )}
        </div>
    );
};
