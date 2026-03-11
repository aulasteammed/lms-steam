"use client";

import { Answer, Question, QuestionType } from "@prisma/client";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ACTIVE_QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  normalizeQuestionType,
} from "@/lib/evaluation";

type QuestionWithAnswers = Question & {
  answers: Answer[];
};

interface QuestionsPreviewFormProps {
  questions: QuestionWithAnswers[];
  courseId: string;
  moduleId: string;
  evaluationId: string;
}

type EditableAnswer = {
  title: string;
  isCorrect: boolean;
};

type DraftQuestion = {
  id: string;
  title: string;
  type: QuestionType;
  answers: EditableAnswer[];
};

const buildDefaultAnswers = (type: QuestionType): EditableAnswer[] => {
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

const normalizeAnswersByType = (
  type: QuestionType,
  answers: EditableAnswer[]
): EditableAnswer[] => {
  const nonEmpty = answers.filter((answer) => answer.title.trim().length > 0);

  if (type === "open") {
    const first = nonEmpty[0] ?? { title: "", isCorrect: true };
    return [{ title: first.title, isCorrect: true }];
  }

  if (type === "sequence") {
    const sequence = (nonEmpty.length > 0 ? nonEmpty : buildDefaultAnswers(type)).map(
      (answer) => ({
        title: answer.title,
        isCorrect: true,
      })
    );

    return sequence;
  }

  if (type === "single") {
    const prepared = nonEmpty.length > 0 ? nonEmpty : buildDefaultAnswers(type);
    let alreadyMarked = false;

    const normalized = prepared.map((answer) => {
      if (answer.isCorrect && !alreadyMarked) {
        alreadyMarked = true;
        return { ...answer, isCorrect: true };
      }

      return { ...answer, isCorrect: false };
    });

    if (!alreadyMarked && normalized.length > 0) {
      normalized[0].isCorrect = true;
    }

    return normalized;
  }

  return nonEmpty.length > 0 ? nonEmpty : buildDefaultAnswers(type);
};

export const QuestionsPreviewForm = ({
  questions,
  courseId,
  moduleId,
  evaluationId,
}: QuestionsPreviewFormProps) => {
  const router = useRouter();
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftQuestion | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const startEdit = (question: QuestionWithAnswers) => {
    const type = normalizeQuestionType(question.type, null);

    setDraft({
      id: question.id,
      title: question.title,
      type,
      answers:
        question.answers.length > 0
          ? normalizeAnswersByType(
              type,
              question.answers.map((answer) => ({
                title: answer.title,
                isCorrect: answer.isCorrect,
              }))
            )
          : buildDefaultAnswers(type),
    });
    setEditingQuestionId(question.id);
  };

  const cancelEdit = () => {
    setEditingQuestionId(null);
    setDraft(null);
  };

  const updateAnswer = (index: number, payload: Partial<EditableAnswer>) => {
    if (!draft) return;

    const updatedAnswers = [...draft.answers];
    updatedAnswers[index] = {
      ...updatedAnswers[index],
      ...payload,
    };

    setDraft({
      ...draft,
      answers: updatedAnswers,
    });
  };

  const addAnswer = () => {
    if (!draft) return;

    if (draft.type === "open") return;

    setDraft({
      ...draft,
      answers: [...draft.answers, { title: "", isCorrect: draft.type === "sequence" }],
    });
  };

  const removeAnswer = (index: number) => {
    if (!draft) return;

    const minimum = draft.type === "open" ? 1 : 2;
    if (draft.answers.length <= minimum) return;

    setDraft({
      ...draft,
      answers: draft.answers.filter((_, answerIndex) => answerIndex !== index),
    });
  };

  const changeType = (type: QuestionType) => {
    if (!draft) return;

    setDraft({
      ...draft,
      type,
      answers: normalizeAnswersByType(type, draft.answers),
    });
  };

  const saveQuestion = async () => {
    if (!draft) return;

    if (draft.title.trim().length < 5) {
      toast.error("El enunciado debe tener al menos 5 caracteres");
      return;
    }

    const normalizedAnswers = normalizeAnswersByType(draft.type, draft.answers);

    if (normalizedAnswers.some((answer) => answer.title.trim().length === 0)) {
      toast.error("Completa los textos de todas las respuestas/pasos");
      return;
    }

    setIsSaving(true);

    try {
      await axios.patch(
        `/api/courses/${courseId}/modules/${moduleId}/evaluations/${evaluationId}/questions/${draft.id}`,
        {
          title: draft.title.trim(),
          type: draft.type,
          answers: normalizedAnswers,
        }
      );

      toast.success("Pregunta actualizada");
      cancelEdit();
      router.refresh();
    } catch (error: any) {
      toast.error(error?.response?.data || "No se pudo actualizar la pregunta");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta pregunta?")) {
      return;
    }

    setIsSaving(true);

    try {
      await axios.delete(
        `/api/courses/${courseId}/modules/${moduleId}/evaluations/${evaluationId}/questions/${questionId}`
      );
      toast.success("Pregunta eliminada");
      if (editingQuestionId === questionId) {
        cancelEdit();
      }
      router.refresh();
    } catch {
      toast.error("No se pudo eliminar la pregunta");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Vista previa y edición de preguntas
        <Button className="invisible" variant="ghost">
          Agregar
        </Button>
      </div>

      {questions.length === 0 ? (
        <p className="text-sm text-gray-500">Aún no se han agregado preguntas.</p>
      ) : (
        <ul className="space-y-3 mt-2">
          {questions.map((question, questionIndex) => {
            const isEditing = editingQuestionId === question.id && draft?.id === question.id;
            const questionType = normalizeQuestionType(question.type, null);

            return (
              <li key={question.id} className="border p-3 rounded bg-white text-sm space-y-3">
                {!isEditing ? (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-800">
                          Pregunta {questionIndex + 1}: {question.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Tipo: {QUESTION_TYPE_LABELS[questionType]}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => startEdit(question)}>
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteQuestion(question.id)}
                          disabled={isSaving}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>

                    <ul className="mt-1 space-y-1">
                      {question.answers.map((answer, answerIndex) => (
                        <li
                          key={answer.id}
                          className={`flex items-start gap-2 ${
                            answer.isCorrect ? "text-sky-700 font-medium" : ""
                          }`}
                        >
                          <span className="font-semibold">{String.fromCharCode(97 + answerIndex)}.</span>
                          <span>
                            {answer.title}
                            {answer.isCorrect && " (Correcta)"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <>
                    <div className="grid gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-600">Enunciado</label>
                        <Input
                          value={draft.title}
                          onChange={(event) =>
                            setDraft({
                              ...draft,
                              title: event.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-600">Tipo de pregunta</label>
                        <select
                          className="w-full rounded-md border border-slate-200 p-2 text-sm"
                          value={draft.type}
                          onChange={(event) => changeType(event.target.value as QuestionType)}
                        >
                          {ACTIVE_QUESTION_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {QUESTION_TYPE_LABELS[type]}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-600">
                          {draft.type === "sequence" ? "Pasos en orden correcto" : "Respuestas"}
                        </label>

                        {draft.answers.map((answer, answerIndex) => (
                          <div key={answerIndex} className="flex items-center gap-2">
                            <Input
                              value={answer.title}
                              placeholder={
                                draft.type === "sequence"
                                  ? `Paso ${answerIndex + 1}`
                                  : `Respuesta ${answerIndex + 1}`
                              }
                              onChange={(event) =>
                                updateAnswer(answerIndex, { title: event.target.value })
                              }
                            />

                            {draft.type === "single" && (
                              <div className="flex items-center gap-1 min-w-max">
                                <Checkbox
                                  checked={answer.isCorrect}
                                  onCheckedChange={(checked) => {
                                    const checkedValue = checked === true;
                                    const normalized = draft.answers.map((item, index) => ({
                                      ...item,
                                      isCorrect: index === answerIndex ? checkedValue : false,
                                    }));

                                    setDraft({
                                      ...draft,
                                      answers: normalized,
                                    });
                                  }}
                                />
                                <span className="text-xs">Correcta</span>
                              </div>
                            )}

                            {draft.type === "multiple" && (
                              <div className="flex items-center gap-1 min-w-max">
                                <Checkbox
                                  checked={answer.isCorrect}
                                  onCheckedChange={(checked) =>
                                    updateAnswer(answerIndex, { isCorrect: checked === true })
                                  }
                                />
                                <span className="text-xs">Correcta</span>
                              </div>
                            )}

                            {draft.type !== "open" && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAnswer(answerIndex)}
                              >
                                Quitar
                              </Button>
                            )}
                          </div>
                        ))}

                        {draft.type !== "open" && (
                          <Button type="button" variant="outline" size="sm" onClick={addAnswer}>
                            {draft.type === "sequence" ? "Añadir paso" : "Añadir respuesta"}
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button type="button" size="sm" onClick={saveQuestion} disabled={isSaving}>
                        Guardar cambios
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={cancelEdit}>
                        Cancelar
                      </Button>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
