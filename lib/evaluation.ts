import { EvaluationType } from "@prisma/client";

export type AppQuestionType = "single" | "multiple" | "open" | "sequence";

export const EVALUATION_TYPE_LABELS: Record<EvaluationType, string> = {
  sequence: "Secuencial",
  locate: "Ubicar (obsoleto)",
  single: "Seleccion unica",
  multiple: "Seleccion multiple",
  open: "Respuesta abierta",
};

export const ACTIVE_QUESTION_TYPES: AppQuestionType[] = [
  "single",
  "multiple",
  "open",
  "sequence",
];

export const QUESTION_TYPE_LABELS: Record<AppQuestionType, string> = {
  single: "Seleccion unica",
  multiple: "Seleccion multiple",
  open: "Respuesta abierta",
  sequence: "Secuencial",
};

export const normalizeQuestionType = (
  questionType: AppQuestionType | null | undefined,
  fallbackEvaluationType?: EvaluationType | null
): AppQuestionType => {
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
