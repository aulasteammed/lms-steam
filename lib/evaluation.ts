import { EvaluationType, QuestionType } from "@prisma/client";

export const EVALUATION_TYPE_LABELS: Record<EvaluationType, string> = {
  sequence: "Secuencial",
  locate: "Ubicar (obsoleto)",
  single: "Selección única",
  multiple: "Selección múltiple",
  open: "Respuesta abierta",
};

export const ACTIVE_EVALUATION_TYPES: EvaluationType[] = [
  "single",
  "multiple",
  "open",
  "sequence",
];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  single: "Selección única",
  multiple: "Selección múltiple",
  open: "Respuesta abierta",
  sequence: "Secuencial",
};

export const ACTIVE_QUESTION_TYPES: QuestionType[] = [
  "single",
  "multiple",
  "open",
  "sequence",
];

export const normalizeQuestionType = (
  questionType: QuestionType | null | undefined,
  fallbackEvaluationType?: EvaluationType | null
): QuestionType => {
  if (questionType) {
    return questionType;
  }

  if (fallbackEvaluationType === "sequence" || fallbackEvaluationType === "locate") {
    return "sequence";
  }

  if (
    fallbackEvaluationType === "single" ||
    fallbackEvaluationType === "multiple" ||
    fallbackEvaluationType === "open"
  ) {
    return fallbackEvaluationType;
  }

  return "single";
};
