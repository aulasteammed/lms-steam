"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import { GripVertical } from "lucide-react";
import { FileUpload } from "@/components/file-upload";

import {
    Block, BlockType, ImagePosition, Template, SocialPlatform,
    CHAR_LIMITS, TEMPLATE_LABELS, SocialIcon, charColor, LIST_ITEM_MIN, LIST_MAX_ITEMS, uid,
} from "./types";

// ─── Editable field ───────────────────────────────────────────────────────────

function makeEditableField(placeholderColor: string) {
    return function EditableFieldInner({ value, onChange, placeholder, className, multiline = false, disabled = false }: {
        value: string; onChange: (v: string) => void;
        placeholder: string; className?: string; multiline?: boolean; disabled?: boolean;
    }) {
        const ref         = useRef<HTMLDivElement>(null);
        const isComposing = useRef(false);
        const isFocused   = useRef(false);

        useEffect(() => {
            if (!ref.current) return;
            if (isFocused.current) return;
            const current = ref.current.innerText.replace(/\n$/, "");
            const next    = value.replace(/\n$/, "");
            if (current !== next) ref.current.innerText = value;
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [value]);

        return (
            <div
                ref={ref}
                contentEditable={!disabled}
                suppressContentEditableWarning
                data-placeholder={placeholder}
                onFocus={() => { if (!disabled) isFocused.current = true; }}
                onBlur={() => {
                    isFocused.current = false;
                    if (!disabled) onChange(ref.current?.innerText ?? "");
                }}
                onPaste={(e) => { e.preventDefault(); const text = e.clipboardData.getData("text/plain"); document.execCommand("insertText", false, text); }}
                onCompositionStart={() => { isComposing.current = true; }}
                onCompositionEnd={() => { isComposing.current = false; if (!disabled) onChange(ref.current?.innerText ?? ""); }}
                onInput={() => { if (!isComposing.current && !disabled) onChange(ref.current?.innerText ?? ""); }}
                className={[
                    "outline-none",
                    disabled ? "cursor-default" : "cursor-text",
                    `empty:before:content-[attr(data-placeholder)] empty:before:${placeholderColor} empty:before:pointer-events-none`,
                    multiline ? "whitespace-pre-wrap" : "whitespace-normal break-words",
                    className,
                ].join(" ")}
            />
        );
    };
}

const EditableField      = makeEditableField("text-white/20");
const EditableFieldLight = makeEditableField("text-slate-300");

// ─── Author byline ────────────────────────────────────────────────────────────

function AuthorByline({
    authorName, authorBio, authorSocialPlatform, authorSocialUrl,
    authorPhoto, accent, dark = false,
}: {
    authorName: string; authorBio: string;
    authorSocialPlatform: SocialPlatform | ""; authorSocialUrl: string;
    authorPhoto?: string; accent: string; dark?: boolean;
}) {
    const initials = authorName ? authorName.slice(0, 2).toUpperCase() : "AU";
    const textMain = dark ? "text-white/90" : "text-slate-800";
    const textSub  = dark ? "text-white/50" : "text-slate-500";
    const border   = dark ? "border-white/10" : "border-slate-200";

    return (
        <div className={`flex items-start gap-3 py-3 border-t border-b ${border}`}>
            <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden" style={{ background: authorPhoto ? undefined : accent }}>
                {authorPhoto
                    ? <Image src={authorPhoto} alt={authorName} width={36} height={36} className="object-cover w-full h-full" />
                    : <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">{initials}</div>
                }
            </div>
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className={`text-sm font-semibold leading-tight ${textMain}`}>{authorName || "Nombre del autor"}</span>
                {authorSocialPlatform && authorSocialUrl && (
                    <span className={`text-[11px] flex items-center gap-1.5 ${textSub}`}>
                        <span className="flex-shrink-0 opacity-70"><SocialIcon platform={authorSocialPlatform} /></span>
                        <span className="truncate">{authorSocialUrl}</span>
                    </span>
                )}
                {authorBio && <span className={`text-xs leading-relaxed mt-1 ${textSub}`}>{authorBio}</span>}
            </div>
        </div>
    );
}

// ─── Block toolbar ────────────────────────────────────────────────────────────

function BlockToolbar({ blockId, isLocked, onMove, onRemove }: {
    blockId:  string;
    isLocked: boolean;
    onMove:   (id: string, dir: -1 | 1) => void;
    onRemove: (id: string) => void;
}) {
    // No renderizar toolbar si está bloqueado
    if (isLocked) return null;

    return (
        <div className="absolute -top-6 right-0 hidden group-hover:flex items-center gap-[3px] z-30 bg-white shadow-sm border border-slate-200 rounded px-1 py-0.5">
            <div className="w-5 h-5 flex items-center justify-center cursor-grab active:cursor-grabbing">
                <GripVertical className="w-3 h-3 text-slate-400" />
            </div>
            <button onClick={() => onMove(blockId, -1)} className="px-1 py-[2px] text-[10px] text-slate-400 hover:text-slate-700">↑</button>
            <button onClick={() => onMove(blockId,  1)} className="px-1 py-[2px] text-[10px] text-slate-400 hover:text-slate-700">↓</button>
            <div className="w-px h-3 bg-slate-200 mx-0.5" />
            <button onClick={() => onRemove(blockId)} className="px-1 py-[2px] text-[10px] text-red-400 hover:text-red-600">✕</button>
        </div>
    );
}

// ─── Block ops ────────────────────────────────────────────────────────────────

interface BlockOps {
    isLocked: boolean;
    onUpdate: (id: string, patch: Partial<Block>) => void;
    onRemove: (id: string) => void;
    onMove:   (id: string, dir: -1 | 1) => void;
}

// ─── Paragraph ────────────────────────────────────────────────────────────────

function ParagraphBlock({ block, isLocked, onUpdate, onRemove, onMove }: { block: Block } & BlockOps) {
    const editRef     = useRef<HTMLDivElement>(null);
    const isComposing = useRef(false);
    const isFocused   = useRef(false);
    const len         = block.content?.length ?? 0;

    useEffect(() => {
        if (!editRef.current) return;
        // Sincronizar solo si el div no está enfocado (usuario no está escribiendo)
        if (isFocused.current) return;
        const current = editRef.current.innerText.replace(/\n$/, "");
        const next    = (block.content ?? "").replace(/\n$/, "");
        if (current !== next) editRef.current.innerText = block.content ?? "";
    }, [block.id, block.content]);

    const handleInput = () => {
        if (isLocked || isComposing.current) return;
        const text = editRef.current?.innerText ?? "";
        if (text.length > CHAR_LIMITS.paragraph) {
            editRef.current!.innerText = text.slice(0, CHAR_LIMITS.paragraph);
            const range = document.createRange();
            const sel   = window.getSelection();
            range.selectNodeContents(editRef.current!);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
        }
        onUpdate(block.id, { content: editRef.current?.innerText ?? "" });
    };

    return (
        <div className="relative group border border-transparent hover:border-slate-200 transition-colors">
            <BlockToolbar blockId={block.id} isLocked={isLocked} onMove={onMove} onRemove={onRemove} />
            <div ref={editRef} contentEditable={!isLocked} suppressContentEditableWarning
                data-placeholder="Escribe un párrafo..."
                onFocus={() => { isFocused.current = true; }}
                onBlur={() => { isFocused.current = false; }}
                onPaste={(e) => { e.preventDefault(); const text = e.clipboardData.getData("text/plain"); document.execCommand("insertText", false, text); }}
                onCompositionStart={() => { isComposing.current = true; }}
                onCompositionEnd={() => { isComposing.current = false; handleInput(); }}
                onInput={handleInput}
                className={[
                    "text-sm leading-relaxed text-slate-700 px-1 py-1.5 outline-none min-h-[36px]",
                    "empty:before:content-[attr(data-placeholder)] empty:before:text-slate-300 empty:before:pointer-events-none",
                    isLocked ? "cursor-default" : "",
                ].join(" ")} />
            <span className={`text-[9px] block text-right pr-1 pb-0.5 ${charColor(len, CHAR_LIMITS.paragraph)}`}>
                {len}/{CHAR_LIMITS.paragraph}
            </span>
        </div>
    );
}

// ─── Pull quote ───────────────────────────────────────────────────────────────

function PullquoteBlock({ block, accent, isLocked, onUpdate, onRemove, onMove }: { block: Block; accent: string } & BlockOps) {
    const editRef     = useRef<HTMLDivElement>(null);
    const isComposing = useRef(false);
    const isFocused   = useRef(false);
    const len         = block.content?.length ?? 0;

    useEffect(() => {
        if (!editRef.current) return;
        if (isFocused.current) return;
        const current = editRef.current.innerText.replace(/\n$/, "");
        const next    = (block.content ?? "").replace(/\n$/, "");
        if (current !== next) editRef.current.innerText = block.content ?? "";
    }, [block.id, block.content]);

    const handleInput = () => {
        if (!isLocked && !isComposing.current) onUpdate(block.id, { content: editRef.current?.innerText ?? "" });
    };

    return (
        <div className="relative group border border-transparent hover:border-slate-200 transition-colors">
            <BlockToolbar blockId={block.id} isLocked={isLocked} onMove={onMove} onRemove={onRemove} />
            <div ref={editRef} contentEditable={!isLocked} suppressContentEditableWarning
                data-placeholder="Cita destacada..."
                onFocus={() => { isFocused.current = true; }}
                onBlur={() => { isFocused.current = false; }}
                onPaste={(e) => { e.preventDefault(); const text = e.clipboardData.getData("text/plain"); document.execCommand("insertText", false, text); }}
                onCompositionStart={() => { isComposing.current = true; }}
                onCompositionEnd={() => { isComposing.current = false; handleInput(); }}
                onInput={handleInput}
                className={[
                    "py-2 px-4 text-base italic text-slate-800 leading-snug outline-none",
                    "empty:before:content-[attr(data-placeholder)] empty:before:text-slate-300 empty:before:pointer-events-none",
                    isLocked ? "cursor-default" : "",
                ].join(" ")}
                style={{ borderLeft: `3px solid ${accent}` }} />
            <span className={`text-[9px] block text-right pr-1 pb-0.5 ${charColor(len, CHAR_LIMITS.pullquote)}`}>
                {len}/{CHAR_LIMITS.pullquote}
            </span>
        </div>
    );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function DividerBlock({ block, isLocked, onRemove, onMove }: { block: Block } & Pick<BlockOps, "isLocked" | "onRemove" | "onMove">) {
    return (
        <div className="relative group border border-transparent hover:border-slate-200 py-1">
            <BlockToolbar blockId={block.id} isLocked={isLocked} onMove={onMove} onRemove={onRemove} />
            <hr className="border-t border-dashed border-slate-300 pointer-events-none" />
        </div>
    );
}

// ─── Image block ──────────────────────────────────────────────────────────────

function ImageBlock({ block, isLocked, onUpdate, onRemove, onMove }: { block: Block } & BlockOps) {
    const isFloat  = block.imagePosition === "fl" || block.imagePosition === "fr";
    // En móvil siempre ocupa ancho completo (stack vertical), en md+ flota
    const floatCls = block.imagePosition === "fl"
        ? "md:float-left md:mr-4 mb-3"
        : block.imagePosition === "fr"
            ? "md:float-right md:ml-4 mb-3"
            : "";
    const widthCls = isFloat ? "w-full md:w-[42%]" : "w-full";

    return (
        <div className={`relative group ${floatCls} ${widthCls}`}>
            <BlockToolbar blockId={block.id} isLocked={isLocked} onMove={onMove} onRemove={onRemove} />
            {block.imageUrl ? (
                <div className={["relative overflow-hidden border border-slate-200", isFloat ? "aspect-[4/3]" : "aspect-video"].join(" ")}>
                    <Image src={block.imageUrl} alt={block.caption ?? ""} fill className="object-cover" sizes="(max-width: 900px) 100vw, 50vw" />
                    {!isLocked && (
                        <button onClick={() => onUpdate(block.id, { imageUrl: "" })}
                            className="absolute inset-0 bg-black/0 hover:bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-all text-white text-xs font-medium">
                            Cambiar imagen
                        </button>
                    )}
                </div>
            ) : (
                <div className={["border border-dashed border-slate-300 bg-slate-50 rounded-sm overflow-hidden", !isFloat ? "aspect-video" : ""].join(" ")}>
                    {!isLocked && <FileUpload endpoint="courseImage" action={(url) => { if (url) onUpdate(block.id, { imageUrl: url }); }} />}
                </div>
            )}
            {/* Posición y caption — solo editables si no está bloqueado */}
            {!isLocked && (
                <div className="flex gap-1 mt-1.5">
                    {(["fl", "fw", "fr"] as ImagePosition[]).map((pos) => (
                        <button key={pos} onClick={() => onUpdate(block.id, { imagePosition: pos })}
                            className={["text-[9px] px-2 py-0.5 rounded border transition-colors",
                                block.imagePosition === pos
                                    ? "bg-slate-800 text-white border-slate-800"
                                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                            ].join(" ")}>
                            {pos === "fl" ? "← Izq" : pos === "fw" ? "Ancho" : "Der →"}
                        </button>
                    ))}
                </div>
            )}
            <input value={block.caption ?? ""} onChange={(e) => onUpdate(block.id, { caption: e.target.value })}
                placeholder="Descripción de la imagen..." maxLength={CHAR_LIMITS.caption}
                disabled={isLocked}
                className={[
                    "w-full text-xs text-slate-400 px-1 mt-1 outline-none bg-transparent placeholder:text-slate-300 border-b border-transparent transition-colors",
                    isLocked ? "cursor-default" : "focus:border-slate-200",
                ].join(" ")} />
        </div>
    );
}


// ─── List block ───────────────────────────────────────────────────────────────

function ListBlock({ block, isLocked, onUpdate, onRemove, onMove }: { block: Block } & BlockOps) {
    const items = block.items ?? [""];

    const updateItem = (idx: number, val: string) => {
        const next = [...items];
        next[idx]  = val.slice(0, CHAR_LIMITS.listItem);
        onUpdate(block.id, { items: next });
    };

    const addItem = () => {
        if (items.length >= LIST_MAX_ITEMS) return;
        onUpdate(block.id, { items: [...items, ""] });
    };

    const removeItem = (idx: number) => {
        const next = items.filter((_, i) => i !== idx);
        onUpdate(block.id, { items: next.length ? next : [""] });
    };

    return (
        <div className="relative group border border-transparent hover:border-slate-200 transition-colors px-1 py-1.5">
            <BlockToolbar blockId={block.id} isLocked={isLocked} onMove={onMove} onRemove={onRemove} />
            <ul className="flex flex-col gap-1">
                {items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                        <span className="text-slate-400 text-base flex-shrink-0 w-4 text-center select-none">•</span>
                        <input
                            value={item}
                            onChange={(e) => updateItem(idx, e.target.value)}
                            onPaste={(e) => {
                                e.preventDefault();
                                const text = e.clipboardData.getData("text/plain").replace(/\n/g, " ");
                                updateItem(idx, (item + text).slice(0, CHAR_LIMITS.listItem));
                            }}
                            disabled={isLocked}
                            placeholder={`Ítem ${idx + 1}...`}
                            maxLength={CHAR_LIMITS.listItem}
                            className={[
                                "flex-1 text-sm text-slate-700 bg-transparent outline-none border-b border-transparent transition-colors placeholder:text-slate-300",
                                isLocked ? "cursor-default" : "focus:border-slate-200",
                            ].join(" ")}
                        />
                        <span className={`text-[9px] flex-shrink-0 ${charColor(item.length, CHAR_LIMITS.listItem)}`}>
                            {item.length}/{CHAR_LIMITS.listItem}
                        </span>
                        {!isLocked && items.length > 1 && (
                            <button onClick={() => removeItem(idx)}
                                className="text-[10px] text-red-300 hover:text-red-500 flex-shrink-0 transition-colors">✕</button>
                        )}
                    </li>
                ))}
            </ul>
            {!isLocked && items.length < LIST_MAX_ITEMS && (
                <button onClick={addItem}
                    className="mt-2 ml-6 text-[10px] text-sky-500 hover:text-sky-700 transition-colors flex items-center gap-1">
                    <span>+</span> Agregar ítem
                    <span className="text-slate-400">({items.length}/{LIST_MAX_ITEMS})</span>
                </button>
            )}
            {items.length >= LIST_MAX_ITEMS && !isLocked && (
                <p className="mt-1 ml-6 text-[9px] text-amber-500">Máximo {LIST_MAX_ITEMS} ítems por bloque</p>
            )}
        </div>
    );
}

// ─── Block list ───────────────────────────────────────────────────────────────

export type SharedCanvasProps = {
    blocks:        Block[];
    accentColor:   string;
    isLocked?:     boolean;
    onBlockUpdate: (id: string, patch: Partial<Block>) => void;
    onBlockRemove: (id: string) => void;
    onBlockMove:   (id: string, dir: -1 | 1) => void;
    dragHandlers:  { onDragStart: (id: string) => void; onDragEnd: () => void; onDragOver: (id: string) => void; onDrop: (id: string) => void };
    dragState:     { dragging: string | null; dragOver: string | null };
};

function BlockList({ blocks, accentColor, isLocked = false, onBlockUpdate, onBlockRemove, onBlockMove, dragHandlers, dragState }: SharedCanvasProps) {
    const ops: BlockOps = { isLocked, onUpdate: onBlockUpdate, onRemove: onBlockRemove, onMove: onBlockMove };

    type Group =
        | { kind: "flow"; imgBlock: Block; textBlocks: Block[] }
        | { kind: "solo"; block: Block };

    const groups: Group[] = [];
    let i = 0;
    while (i < blocks.length) {
        const b         = blocks[i];
        const isFloated = b.type === "image" && (b.imagePosition === "fl" || b.imagePosition === "fr");
        if (isFloated) {
            const textBlocks: Block[] = [];
            let j = i + 1;
            // Paragraph, pullquote y list fluyen alrededor de la imagen flotante
            const flowable = new Set(["paragraph", "pullquote", "list"]);
            while (j < blocks.length && flowable.has(blocks[j].type)) { textBlocks.push(blocks[j]); j++; }
            groups.push({ kind: "flow", imgBlock: b, textBlocks });
            i = j;
        } else {
            groups.push({ kind: "solo", block: b });
            i++;
        }
    }

    const renderSolo = (b: Block) => {
        switch (b.type) {
            case "paragraph": return <ParagraphBlock  key={b.id} block={b} {...ops} />;
            case "pullquote": return <PullquoteBlock  key={b.id} block={b} accent={accentColor} {...ops} />;
            case "divider":   return <DividerBlock    key={b.id} block={b} isLocked={isLocked} onRemove={ops.onRemove} onMove={ops.onMove} />;
            case "image":     return <ImageBlock      key={b.id} block={b} {...ops} />;
            case "list":      return <ListBlock       key={b.id} block={b} {...ops} />;
        }
    };

    return (
        <div className="flex flex-col gap-1">
            {groups.map((group, gi) => {
                if (group.kind === "solo") {
                    return (
                        <div key={group.block.id}
                            draggable={!isLocked}
                            onDragStart={() => !isLocked && dragHandlers.onDragStart(group.block.id)}
                            onDragEnd={() => dragHandlers.onDragEnd()}
                            onDragOver={(e) => { e.preventDefault(); !isLocked && dragHandlers.onDragOver(group.block.id); }}
                            onDrop={(e) => { e.preventDefault(); !isLocked && dragHandlers.onDrop(group.block.id); }}
                            className={[
                                dragState.dragging === group.block.id ? "opacity-40" : "",
                                dragState.dragOver  === group.block.id ? "ring-1 ring-sky-400 ring-inset rounded" : "",
                            ].join(" ")}>
                            {renderSolo(group.block)}
                        </div>
                    );
                }
                return (
                    <div key={`flow-${gi}`} className="block">
                        <ImageBlock block={group.imgBlock} {...ops} />
                        {group.textBlocks.map((tb) => renderSolo(tb))}
                        <div className="clear-both" />
                    </div>
                );
            })}
        </div>
    );
}

// ─── Template props ───────────────────────────────────────────────────────────

export type TemplateProps = SharedCanvasProps & {
    title:                string;
    subtitle:             string;
    authorName:           string;
    authorBio:            string;
    authorPhoto:          string;
    authorSocialPlatform: SocialPlatform | "";
    authorSocialUrl:      string;
    coverImageUrl:        string;
    onTitleChange:        (v: string) => void;
    onSubtitleChange:     (v: string) => void;

    onCoverUpload:        (url: string) => void;
};

// ─── Cover image zone ─────────────────────────────────────────────────────────

function CoverImageZone({ imageUrl, isLocked, onUpload }: { imageUrl: string; isLocked: boolean; onUpload: (url: string) => void }) {
    if (imageUrl) {
        return (
            <div className="relative w-full aspect-[16/7] overflow-hidden group">
                <Image src={imageUrl} alt="Portada" fill className="object-cover" sizes="900px" />
                {!isLocked && (
                    <button onClick={() => onUpload("")}
                        className="absolute inset-0 bg-black/0 hover:bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-white text-sm font-medium">
                        Cambiar portada
                    </button>
                )}
            </div>
        );
    }
    if (isLocked) return null;
    return (
        <div className="w-full border-2 border-dashed border-amber-300 bg-amber-50 rounded-sm overflow-hidden">
            <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Foto de portada</span>
                <span className="text-[10px] text-amber-500 bg-amber-100 px-1.5 py-0.5 rounded">Obligatoria</span>
            </div>
            <FileUpload endpoint="courseImage" action={(url) => { if (url) onUpload(url); }} />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Templates
// ═══════════════════════════════════════════════════════════════════════════════

function CanvasCoverPerson({
    title, subtitle, authorName, authorBio, authorPhoto,
    authorSocialPlatform, authorSocialUrl,
    coverImageUrl, accentColor, dark, isLocked = false,
    onTitleChange, onSubtitleChange, onCoverUpload,
    ...shared
}: TemplateProps & { dark: string }) {
    const initials = authorName ? authorName.slice(0, 2).toUpperCase() : "AU";
    return (
        <div className="grid" style={{ gridTemplateColumns: "45% 55%", minHeight: 680 }}>
            <div className="relative flex flex-col justify-between overflow-hidden" style={{ background: dark, minHeight: 680 }}>
                {coverImageUrl && (
                    <>
                        <div className="absolute inset-0">
                            <Image src={coverImageUrl} alt="Portada" fill className="object-cover" sizes="400px" />
                        </div>
                        <div className="absolute inset-0"
                            style={{ background: `linear-gradient(to bottom, ${dark}cc 0%, ${dark}55 30%, ${dark}22 50%, ${dark}99 70%, ${dark}f0 100%)` }} />
                    </>
                )}
                {!coverImageUrl && (
                    <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
                )}
                <div className="relative z-10 p-6">
                    <span className="text-[9px] tracking-[0.3em] uppercase font-medium" style={{ color: accentColor }}>Personaje</span>
                </div>
                <div className="relative z-10 p-6 pb-8">
                    <div className="w-8 h-[3px] mb-4 rounded-full" style={{ background: accentColor }} />
                    <EditableField value={title} onChange={onTitleChange} placeholder="Título del artículo" disabled={isLocked}
                        className="text-[42px] font-black leading-[0.88] tracking-[-1.5px] text-white mb-4 block" />
                    <EditableField value={subtitle} onChange={onSubtitleChange} placeholder="Subtítulo o entradilla..." multiline disabled={isLocked}
                        className="text-[12px] leading-relaxed text-white/50 block" />
                </div>
            </div>
            <div className="flex flex-col" style={{ background: "#fafaf8", padding: "28px 24px" }}>
                <div className="flex items-start gap-3 pb-4 mb-4 border-b border-slate-200">
                    <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 border-2"
                        style={{ borderColor: accentColor, background: authorPhoto ? undefined : accentColor }}>
                        {authorPhoto
                            ? <Image src={authorPhoto} alt={authorName} width={44} height={44} className="object-cover w-full h-full" />
                            : <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">{initials}</div>
                        }
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 leading-tight">{authorName || "Nombre del autor"}</p>
                        {authorSocialPlatform && authorSocialUrl && (
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <SocialIcon platform={authorSocialPlatform} />
                                <span className="truncate">{authorSocialUrl}</span>
                            </p>
                        )}
                        {authorBio && <p className="text-[11px] text-slate-500 leading-relaxed mt-1">{authorBio}</p>}
                    </div>
                </div>
                <div className="flex-1">
                    <BlockList {...shared} accentColor={accentColor} isLocked={isLocked} />
                </div>
                {!coverImageUrl && !isLocked && (
                    <div className="mt-4 pt-4 border-t border-amber-200">
                        <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider mb-2">⚠ Foto de portada requerida</p>
                        <div className="border-2 border-dashed border-amber-300 bg-amber-50 rounded overflow-hidden">
                            <FileUpload endpoint="courseImage" action={(url) => { if (url) onCoverUpload(url); }} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function CanvasFullArticle({
    title, subtitle, authorName, authorBio, authorPhoto,
    authorSocialPlatform, authorSocialUrl,
    coverImageUrl, accentColor, isLocked = false, onTitleChange, onSubtitleChange, onCoverUpload, ...shared
}: TemplateProps) {
    return (
        <div className="p-8">
            <div className="mb-6"><CoverImageZone imageUrl={coverImageUrl} isLocked={isLocked} onUpload={onCoverUpload} /></div>
            <EditableFieldLight value={title} onChange={onTitleChange} placeholder="Título del artículo" disabled={isLocked}
                className="text-3xl font-bold tracking-tight leading-tight text-slate-900 mb-2" />
            <EditableFieldLight value={subtitle} onChange={onSubtitleChange} placeholder="Subtítulo..." multiline disabled={isLocked}
                className="text-sm italic text-slate-400 mb-5" />
            <AuthorByline authorName={authorName} authorBio={authorBio} authorPhoto={authorPhoto}
                authorSocialPlatform={authorSocialPlatform} authorSocialUrl={authorSocialUrl} accent={accentColor} />
            <div className="mt-5"><BlockList {...shared} accentColor={accentColor} isLocked={isLocked} /></div>
        </div>
    );
}

function CanvasProfileSimple({
    title, subtitle, authorName, authorBio, authorPhoto,
    authorSocialPlatform, authorSocialUrl,
    coverImageUrl, accentColor, isLocked = false, onTitleChange, onSubtitleChange, onCoverUpload, ...shared
}: TemplateProps) {
    return (
        <div className="p-8">
            <div className="mb-6"><CoverImageZone imageUrl={coverImageUrl} isLocked={isLocked} onUpload={onCoverUpload} /></div>
            <div className="grid gap-5 mb-6 items-start" style={{ gridTemplateColumns: "88px 1fr" }}>
                <div className="w-[88px] h-[88px] rounded-full overflow-hidden flex-shrink-0 border-2"
                    style={{ borderColor: accentColor, background: authorPhoto ? undefined : "#f1f5f9" }}>
                    {authorPhoto
                        ? <Image src={authorPhoto} alt={authorName} width={88} height={88} className="object-cover w-full h-full" />
                        : coverImageUrl
                            ? <Image src={coverImageUrl} alt="Perfil" width={88} height={88} className="object-cover w-full h-full" />
                            : <div className="w-full h-full flex items-center justify-center text-3xl text-slate-300">👤</div>
                    }
                </div>
                <div className="flex flex-col gap-1 pt-1">
                    <EditableFieldLight value={title || authorName} onChange={onTitleChange} placeholder="Nombre del perfil" disabled={isLocked}
                        className="text-2xl font-bold tracking-tight text-slate-900" />
                    <EditableFieldLight value={subtitle} onChange={onSubtitleChange} placeholder="Cargo o descripción..." multiline disabled={isLocked}
                        className="text-sm text-slate-500 leading-relaxed" />
                    {authorSocialPlatform && authorSocialUrl && (
                        <span className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                            <SocialIcon platform={authorSocialPlatform} /><span>{authorSocialUrl}</span>
                        </span>
                    )}
                    {authorBio && <p className="text-xs text-slate-500 leading-relaxed mt-2 pt-2 border-t border-slate-100">{authorBio}</p>}
                </div>
            </div>
            <hr className="border-slate-200 mb-5" />
            <BlockList {...shared} accentColor={accentColor} isLocked={isLocked} />
        </div>
    );
}

function CanvasNewsShort({
    title, subtitle, authorName, authorBio, authorPhoto,
    authorSocialPlatform, authorSocialUrl,
    coverImageUrl, accentColor, isLocked = false, onTitleChange, onSubtitleChange, onCoverUpload, ...shared
}: TemplateProps) {
    return (
        <div style={{ padding: "36px 48px", maxWidth: 620, margin: "0 auto" }}>
            {!coverImageUrl
                ? <div className="mb-5"><CoverImageZone imageUrl={coverImageUrl} isLocked={isLocked} onUpload={onCoverUpload} /></div>
                : <div className="mb-5 relative w-full aspect-[16/7] overflow-hidden group rounded-sm">
                    <Image src={coverImageUrl} alt="Portada" fill className="object-cover" sizes="620px" />
                    {!isLocked && (
                        <button onClick={() => onCoverUpload("")}
                            className="absolute inset-0 bg-black/0 hover:bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-white text-sm font-medium">
                            Cambiar portada
                        </button>
                    )}
                  </div>
            }
            <div className="text-[9px] tracking-widest uppercase mb-2" style={{ color: accentColor }}>Noticia</div>
            <EditableFieldLight value={title} onChange={onTitleChange} placeholder="Título de la noticia" disabled={isLocked}
                className="text-2xl font-bold tracking-tight text-slate-900 mb-1" />
            <div className="h-0.5 w-9 mb-4" style={{ background: accentColor }} />
            <EditableFieldLight value={subtitle} onChange={onSubtitleChange} placeholder="Entradilla breve..." multiline disabled={isLocked}
                className="text-sm text-slate-500 leading-relaxed mb-5" />
            <BlockList {...shared} accentColor={accentColor} isLocked={isLocked} />
            <div className="mt-6">
                <AuthorByline authorName={authorName} authorBio={authorBio} authorPhoto={authorPhoto}
                    authorSocialPlatform={authorSocialPlatform} authorSocialUrl={authorSocialUrl} accent={accentColor} />
            </div>
        </div>
    );
}

// ─── Canvas wrapper ───────────────────────────────────────────────────────────

interface CanvasProps extends TemplateProps {
    template:  Template;
    darkColor: string;
    isSaving:  boolean;
    isLocked:  boolean;
    lastSaved: Date | null;
}

export function ArticleCanvas({ template, darkColor, isSaving, lastSaved, isLocked, ...props }: CanvasProps) {
    return (
        <main className="flex-1 overflow-y-auto bg-slate-100 flex flex-col items-center px-6 py-5 gap-3">
            <div className="w-full max-w-[860px] flex items-center gap-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {TEMPLATE_LABELS[template]}
                </span>
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[10px] text-slate-400">
                    {isLocked
                        ? " Solo lectura"
                        : isSaving
                            ? "Guardando..."
                            : lastSaved
                                ? `✓ guardado ${lastSaved.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`
                                : "Sin cambios"}
                </span>
            </div>
            <div className="w-full max-w-[860px] bg-white shadow-lg rounded-sm overflow-hidden">
                {template === "cover_person"   && <CanvasCoverPerson   {...props} dark={darkColor} isLocked={isLocked} />}
                {template === "full_article"   && <CanvasFullArticle   {...props} isLocked={isLocked} />}
                {template === "profile_simple" && <CanvasProfileSimple {...props} isLocked={isLocked} />}
                {template === "news_short"     && <CanvasNewsShort     {...props} isLocked={isLocked} />}
            </div>
        </main>
    );
}
