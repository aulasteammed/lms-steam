"use client";

import { ChevronDown } from "lucide-react";
import type { Project } from "@/lib/projects";

type IntroCardProps = {
  title: string;
  text: string;
  projects: Project[];
  onSelect: (index: number) => void;
};

/**
 * Card de portada del recorrido (primera de la columna): título de la
 * sección, introducción e índice de proyectos.
 */
export const IntroCard = ({ title, text, projects, onSelect }: IntroCardProps) => {
  const places = projects.length === 1 ? "proyecto" : "proyectos";

  return (
    <article className="pointer-events-auto w-full max-h-full overflow-y-auto overscroll-contain rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl md:max-h-none md:overflow-visible md:p-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-orange-700">
        {projects.length} {places} · Medellín y regiones
      </p>
      <h1 className="mt-2 text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-[15px]">
        {text}
      </p>

      <ol className="mt-5 divide-y divide-slate-100 border-y border-slate-100">
        {projects.map((project, i) => (
          <li key={project.id}>
            <button
              type="button"
              onClick={() => onSelect(i)}
              className="group flex w-full items-center gap-3 py-2.5 text-left"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-600 text-xs font-semibold text-white">
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-slate-800 transition group-hover:text-orange-700">
                  {project.title}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {project.place}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>

      {projects.length > 0 && (
        <button
          type="button"
          onClick={() => onSelect(0)}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
        >
          Comenzar recorrido
          <ChevronDown className="h-4 w-4 md:animate-bounce" />
        </button>
      )}
    </article>
  );
};
