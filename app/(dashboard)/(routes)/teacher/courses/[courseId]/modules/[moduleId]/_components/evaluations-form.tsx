"use client";

import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Pencil } from "lucide-react";
import { Evaluation } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface EvaluationsFormProps {
  courseId: string;
  moduleId: string;
  evaluation: Evaluation | null;
}

export const EvaluationsForm = ({
  courseId,
  moduleId,
  evaluation,
}: EvaluationsFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      const response = await axios.post(`/api/courses/${courseId}/modules/${moduleId}/evaluations`);
      toast.success("Evaluación creada");
      router.push(`/teacher/courses/${courseId}/modules/${moduleId}/evaluations/${response.data.id}`);
      router.refresh();
    } catch {
      toast.error("Error al crear la evaluación");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = () => {
    if (!evaluation?.id) return;
    router.push(`/teacher/courses/${courseId}/modules/${moduleId}/evaluations/${evaluation.id}`);
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Evaluación del módulo
        <Button
          onClick={evaluation ? handleEdit : handleCreate}
          variant="ghost"
          disabled={isSubmitting}
        >
          <Pencil className="h-4 w-4 mr-2" />
          {evaluation ? "Editar evaluación" : "Crear evaluación"}
        </Button>
      </div>

      <div className="flex items-center justify-between mt-2">
        <p
          className={cn(
            "text-sm",
            !evaluation && "text-slate-500 italic"
          )}
        >
          {evaluation
            ? "La evaluación admite preguntas de múltiples tipos"
            : "Sin evaluación"}
        </p>

        {evaluation && (
          <Badge className={cn("bg-slate-500", evaluation.isPublished && "bg-sky-700")}>
            {evaluation.isPublished ? "Publicado" : "Borrador"}
          </Badge>
        )}
      </div>
    </div>
  );
};
