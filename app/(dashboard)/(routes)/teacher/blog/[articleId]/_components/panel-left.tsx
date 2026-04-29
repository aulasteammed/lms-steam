"use client";

import { Template, BlockType, ACCENT_SWATCHES, DARK_SWATCHES, TEMPLATE_LABELS, CHAR_LIMITS, MAX_IMAGES } from "./types";

function MiniCover({ dark, accent }: { dark: string; accent: string }) {
    return (
        <div className="h-[50px] grid grid-cols-2 overflow-hidden">
            <div style={{ background: dark }} />
            <div className="bg-white flex flex-col gap-[2px] p-[5px]">
                <div className="h-[4px] bg-slate-800 rounded-[1px]" />
                <div className="h-[3px] rounded-[1px]" style={{ background: accent, width: "60%" }} />
                <div className="h-[3px] bg-slate-200 rounded-[1px] w-[80%]" />
                <div className="h-[3px] bg-slate-200 rounded-[1px] w-[90%]" />
            </div>
        </div>
    );
}
function MiniFull() {
    return (
        <div className="h-[50px] bg-white flex flex-col gap-[2px] p-[5px]">
            <div className="h-[14px] bg-slate-100 rounded-[1px] mb-[2px]" />
            <div className="h-[4px] bg-slate-800 rounded-[1px] w-[75%]" />
            <div className="h-[3px] bg-slate-200 rounded-[1px] w-[90%]" />
            <div className="h-[3px] bg-slate-200 rounded-[1px] w-[80%]" />
        </div>
    );
}
function MiniProfile() {
    return (
        <div className="h-[50px] bg-white grid gap-[4px] p-[5px]" style={{ gridTemplateColumns: "16px 1fr" }}>
            <div className="w-[16px] h-[16px] rounded-full bg-slate-200" />
            <div className="flex flex-col gap-[2px]">
                <div className="h-[4px] bg-slate-800 rounded-[1px] w-[80%]" />
                <div className="h-[3px] bg-slate-200 rounded-[1px] w-[60%]" />
                <div className="h-[3px] bg-slate-200 rounded-[1px] w-[90%]" />
            </div>
        </div>
    );
}
function MiniNews({ accent }: { accent: string }) {
    return (
        <div className="h-[50px] bg-white flex flex-col gap-[2px] p-[5px]">
            <div className="h-[3px] rounded-[1px] w-[30%]" style={{ background: accent }} />
            <div className="h-[4px] bg-slate-800 rounded-[1px] w-[90%]" />
            <div className="h-[4px] bg-slate-800 rounded-[1px] w-[70%]" />
            <div className="h-[3px] bg-slate-200 rounded-[1px] w-full" />
        </div>
    );
}

interface PanelLeftProps {
    template:      Template;
    accentColor:   string;
    darkColor:     string;
    imageCount:    number;
    coverImageUrl: string;
    isLocked:      boolean;
    onTemplateChange:    (t: Template)  => void;
    onAccentColorChange: (c: string)    => void;
    onDarkColorChange:   (c: string)    => void;
    onAddBlock:          (t: BlockType) => void;
}

export function PanelLeft({
    template, accentColor, darkColor, imageCount, coverImageUrl, isLocked,
    onTemplateChange, onAccentColorChange, onDarkColorChange, onAddBlock,
}: PanelLeftProps) {

    const imageBlocksAllowed = MAX_IMAGES - 1 - imageCount;
    const canAddImage        = imageBlocksAllowed > 0;

    const BLOCKS: { type: BlockType; icon: string; label: string; disabled?: boolean; hint?: string }[] = [
        { type: "paragraph", icon: "¶", label: "Párrafo" },
        { type: "image",     icon: "🖼", label: "Imagen",
          disabled: !canAddImage,
          hint: !canAddImage
            ? `Máx. ${MAX_IMAGES} imágenes (incluida portada)`
            : `${imageBlocksAllowed} imagen${imageBlocksAllowed !== 1 ? "es" : ""} restante${imageBlocksAllowed !== 1 ? "s" : ""}` },
        { type: "pullquote", icon: '"', label: "Pull Quote" },
        { type: "divider",   icon: "—", label: "Separador"  },
        { type: "list",      icon: "•", label: "Lista"       },
    ];

    const lockedCls = isLocked ? "opacity-40 pointer-events-none select-none" : "";

    return (
        <aside className="w-[240px] flex-shrink-0 bg-white border-r border-slate-200 overflow-y-auto flex flex-col min-h-0">

            {isLocked && (
                <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
                    <span className="text-[11px] text-emerald-700 font-medium leading-tight">
                        Artículo publicado · solo lectura
                    </span>
                </div>
            )}

            <div className={`p-4 border-b border-slate-200 ${lockedCls}`}>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3 block">Plantilla</span>
                <div className="grid grid-cols-2 gap-1.5">
                    {(["cover_person", "full_article", "profile_simple", "news_short"] as Template[]).map((tpl) => (
                        <button key={tpl} onClick={() => onTemplateChange(tpl)}
                            className={["border-2 rounded-lg overflow-hidden transition-all text-left",
                                template === tpl ? "border-sky-500" : "border-slate-200 hover:border-sky-300"
                            ].join(" ")}>
                            <div className="h-[50px] overflow-hidden pointer-events-none">
                                {tpl === "cover_person"   && <MiniCover dark={darkColor} accent={accentColor} />}
                                {tpl === "full_article"   && <MiniFull />}
                                {tpl === "profile_simple" && <MiniProfile />}
                                {tpl === "news_short"     && <MiniNews accent={accentColor} />}
                            </div>
                            <div className={["text-[9px] text-center py-1 border-t border-slate-100",
                                template === tpl ? "text-sky-600 font-semibold" : "text-slate-400"
                            ].join(" ")}>
                                {TEMPLATE_LABELS[tpl]}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className={`p-4 border-b border-slate-200 ${lockedCls}`}>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3 block">Agregar bloque</span>
                <div className="flex flex-col gap-1.5">
                    {BLOCKS.map(({ type, icon, label, disabled, hint }) => (
                        <div key={type}>
                            <button
                                onClick={() => !disabled && onAddBlock(type)}
                                disabled={disabled}
                                title={hint}
                                className={[
                                    "w-full flex items-center gap-2 px-3 py-2 border rounded-md text-sm transition-all text-left",
                                    disabled
                                        ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white hover:border-sky-300 hover:text-sky-600",
                                ].join(" ")}>
                                <span className="w-4 text-center text-base">{icon}</span>
                                <span className="flex-1">{label}</span>
                                {hint && !disabled && (
                                    <span className="text-[9px] text-slate-400">{hint}</span>
                                )}
                            </button>
                            {disabled && hint && (
                                <p className="text-[9px] text-amber-500 mt-0.5 px-1">{hint}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className={`p-4 border-b border-slate-200 ${lockedCls}`}>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3 block">Colores</span>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs text-slate-500">Acento</span>
                        <div className="flex gap-1 flex-wrap items-center">
                            {ACCENT_SWATCHES.map((c) => (
                                <button key={c} onClick={() => onAccentColorChange(c)}
                                    className={["w-5 h-5 rounded-full border-2 transition-all hover:scale-110",
                                        accentColor === c ? "border-sky-500 scale-110" : "border-transparent"
                                    ].join(" ")} style={{ background: c }} />
                            ))}
                            <label className="w-5 h-5 rounded-full border-2 border-dashed border-slate-200 overflow-hidden cursor-pointer hover:scale-110 transition-all">
                                <input type="color" value={accentColor} onChange={(e) => onAccentColorChange(e.target.value)}
                                    className="w-[200%] h-[200%] -ml-[50%] -mt-[50%] cursor-pointer border-none p-0" />
                            </label>
                        </div>
                    </div>
                    <div className={["flex flex-col gap-1.5 transition-opacity",
                        template !== "cover_person" ? "opacity-30 pointer-events-none" : ""
                    ].join(" ")}>
                        <span className="text-xs text-slate-500">
                            Fondo oscuro <span className="text-[10px] text-slate-400">(solo Cover)</span>
                        </span>
                        <div className="flex gap-1 flex-wrap items-center">
                            {DARK_SWATCHES.map((c) => (
                                <button key={c} onClick={() => onDarkColorChange(c)}
                                    className={["w-5 h-5 rounded-full border-2 transition-all hover:scale-110",
                                        darkColor === c ? "border-sky-500 scale-110" : "border-transparent"
                                    ].join(" ")} style={{ background: c }} />
                            ))}
                            <label className="w-5 h-5 rounded-full border-2 border-dashed border-slate-200 overflow-hidden cursor-pointer hover:scale-110 transition-all">
                                <input type="color" value={darkColor} onChange={(e) => onDarkColorChange(e.target.value)}
                                    className="w-[200%] h-[200%] -ml-[50%] -mt-[50%] cursor-pointer border-none p-0" />
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 flex-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3 block">Límites - carácteres</span>
                <div className="text-xs text-slate-500 space-y-0.5">
                    {Object.entries(CHAR_LIMITS).map(([k, v]) => (
                        <div key={k} className="flex justify-between py-1 border-b border-slate-100 last:border-0">
                            <span className="capitalize">{
                                k === "pullquote" ? "Cita" :
                                k === "title"     ? "Título"     :
                                k === "subtitle"  ? "Subtítulo"  :
                                k === "paragraph" ? "Párrafo"    :
                                k === "caption"   ? "Descripción" : 
                                k === "listItem"   ? "Ítems" :
                                k === "hookPhrase"   ? "Frase gancho" : k
                            }</span>
                            <span className="font-medium text-slate-700">{v.toLocaleString()}</span>
                        </div>
                    ))}
                    <div className="flex justify-between py-1 border-b border-slate-100">
                        <span>Imágenes (total)</span>
                        <span className="font-medium text-slate-700">{MAX_IMAGES} máx.</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}