"use client";

import { useState } from "react";
import timelineData from "./TimelineData.json";


type TagKey = "hito" | "ciclo" | "evento" | "participacion";

interface TimelineItem {
  date: string;
  title: string;
  description?: string;
  tag: TagKey;
  sections?: {
    title: string;
    items: string[];
  }[];
}

const TAG_LABELS: Record<TagKey, string> = {
  hito: "Hito Institucional",
  ciclo: "Ciclo Temático",
  evento: "Evento",
  participacion: "Participación Externa",
};

const TAG_STYLES: Record<TagKey, { dot: string; badge: string }> = {
  hito: {
    dot: "bg-amber-400",
    badge: "bg-amber-50 border-amber-300 text-amber-700",
  },
  ciclo: {
    dot: "bg-teal-400",
    badge: "bg-teal-50 border-teal-300 text-teal-700",
  },
  evento: {
    dot: "bg-rose-400",
    badge: "bg-rose-50 border-rose-300 text-rose-700",
  },
  participacion: {
    dot: "bg-violet-400",
    badge: "bg-violet-50 border-violet-300 text-violet-700",
  },
};


function Dot({ tag, active }: { tag: TagKey; active: boolean }) {
  return (
    <div className="flex-shrink-0 w-8 flex justify-center pt-1.5">
      <span
        className={`
          block w-3 h-3 rounded-full relative z-10
          ${TAG_STYLES[tag].dot}
          transition-all duration-300
          ${active ? "ring-4 ring-offset-2 ring-offset-white ring-gray-200" : ""}
        `}
      />
    </div>
  );
}

function TagBadge({ tag }: { tag: TagKey }) {
  return (
    <span
      className={`
        text-xs font-medium tracking-wide px-2.5 py-0.5 rounded-full border
        flex-shrink-0 mt-0.5
        ${TAG_STYLES[tag].badge}
      `}
    >
      {TAG_LABELS[tag]}
    </span>
  );
}

/* ───────────────────────────────────────────────────────────── */
/* Card Component */
/* ───────────────────────────────────────────────────────────── */

function Card({
  item,
  isOpen,
  onClick,
}: {
  item: TimelineItem;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`
        flex-1 rounded-xl border cursor-pointer
        transition-all duration-200
        ${
          isOpen
            ? "bg-gray-50 border-gray-200 shadow-sm"
            : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
        }
      `}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 font-medium tracking-wide mb-1">
              {item.date}
            </p>
            <h3 className="text-base font-semibold text-gray-800 leading-snug">
              {item.title}
            </h3>
          </div>
          <TagBadge tag={item.tag} />
        </div>

        {/* Expandable Content */}
        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            maxHeight: isOpen ? 1200 : 0,
            opacity: isOpen ? 1 : 0,
          }}
        >
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
            {item.description && (
              <p className="text-sm text-gray-500 leading-relaxed">
                {item.description}
              </p>
            )}

            {item.sections &&
              item.sections.map((section, index) => (
                <div key={index}>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    {section.title}
                  </h4>
                  <ul className="text-sm text-gray-500 space-y-1 list-disc list-inside">
                    {section.items.map((subItem, i) => (
                      <li key={i}>{subItem}</li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </div>

        {/* Toggle hint */}
        <p className="text-xs text-gray-300 mt-3 select-none">
          {isOpen ? "▲ cerrar" : "▼ ver más"}
        </p>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────── */
/* Main Timeline Component */
/* ───────────────────────────────────────────────────────────── */

export default function SteamTimeline() {
  const [expanded, setExpanded] = useState<number | null>(null);

  // Timeline invertida: lo más reciente arriba
  const items = (timelineData as TimelineItem[]).slice().reverse();

  return (
    <section className="w-full max-w-5xl mx-auto py-12 px-4">
      {/* Header */}
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-2">
        Cronología del Aula STEAM
      </h2>
      <p className="text-center text-gray-400 text-sm mb-10 tracking-wide">
        2024 – 2025
      </p>

      {/* Timeline */}
      <div className="relative max-w-2xl mx-auto">
        {/* Vertical line */}
        <div
          className="absolute top-0 bottom-0 w-px bg-gray-200"
          style={{ left: 15 }}
        />

        {items.map((item, i) => (
          <div key={i} className="flex gap-6 mb-6 relative">
            <Dot tag={item.tag} active={expanded === i} />
            <Card
              item={item}
              isOpen={expanded === i}
              onClick={() => setExpanded(expanded === i ? null : i)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}