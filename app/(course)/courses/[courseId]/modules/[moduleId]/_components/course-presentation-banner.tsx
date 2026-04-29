import { FileText, Paperclip, Sparkles, Target } from "lucide-react";

import { Separator } from "@/components/ui/separator";

interface CoursePresentationBannerProps {
  courseTitle: string;
  description: string | null;
  previousSkills: string | null;
  developedSkills: string | null;
  attachments: {
    id: string;
    name: string;
    url: string;
  }[];
}

export const CoursePresentationBanner = ({
  courseTitle,
  description,
  previousSkills,
  developedSkills,
  attachments,
}: CoursePresentationBannerProps) => {
  return (
    <section className="w-full rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-sky-50 shadow-sm">
      <div className="p-6 md:p-8">
        <div className="flex flex-col gap-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
            Presentación del curso
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{courseTitle}</h2>
        </div>

        <Separator className="my-5" />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-700">
              <FileText className="h-5 w-5" />
              <h3 className="text-base font-semibold">Descripción</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {description || "Sin descripción disponible."}
            </p>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-700">
              <Target className="h-5 w-5" />
              <h3 className="text-base font-semibold">Habilidades previas</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {previousSkills || "Sin habilidades previas registradas."}
            </p>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-700">
              <Target className="h-5 w-5" />
              <h3 className="text-base font-semibold">
                Habilidades a desarrollar
              </h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {developedSkills || "Sin habilidades a desarrollar registradas."}
            </p>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-700">
              <Paperclip className="h-5 w-5" />
              <h3 className="text-base font-semibold">Anexos del curso</h3>
            </div>
            <div className="mt-3 space-y-2">
              {attachments.length === 0 && (
                <p className="text-sm text-slate-500">
                  No hay anexos disponibles por ahora.
                </p>
              )}
              {attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                >
                  <Paperclip className="h-4 w-4" />
                  <span className="line-clamp-1">
                    Anexo - {courseTitle}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
