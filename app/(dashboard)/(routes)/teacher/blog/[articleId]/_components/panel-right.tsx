"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, Trash2 } from "lucide-react";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
    AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FileUpload } from "@/components/file-upload";

import { SocialPlatform, SOCIAL_OPTIONS, CHAR_LIMITS, charColor } from "./types";

interface PanelRightProps {
    title:                string;
    subtitle:             string;
    authorName:           string;
    authorBio:            string;
    authorPhoto:          string;
    authorSocialPlatform: SocialPlatform | "";
    authorSocialUrl:      string;
    status:               string;
    viewCount:            number;
    coverImageUrl:        string;
    hookPhrase:           string;
    isPublishing:         boolean;
    isDeleting:           boolean;
    isLocked:             boolean;
    canPublish:           boolean;
    hasValidTextBlock:    boolean;
    hasBodyImage:         boolean;
    onHookPhraseChange:          (v: string)              => void;
    onTitleChange:               (v: string)              => void;
    onSubtitleChange:            (v: string)              => void;
    onAuthorNameChange:          (v: string)              => void;
    onAuthorBioChange:           (v: string)              => void;
    onAuthorPhotoChange:         (v: string)              => void;
    onAuthorSocialPlatformChange:(v: SocialPlatform | "") => void;
    onAuthorSocialUrlChange:     (v: string)              => void;
    onPublish:   (action: "publish" | "unpublish" | "archive") => void;
    onDelete:    () => void;
    onGoToList:  () => void;
}

function AuthorPhotoField({ authorPhoto, authorName, initials, isLocked, onAuthorPhotoChange }: {
    authorPhoto:         string;
    authorName:          string;
    initials:            string;
    isLocked:            boolean;
    onAuthorPhotoChange: (url: string) => void;
}) {
    const [open, setOpen] = useState(false);

    const handleUpload = (url?: string) => {
        if (url) { onAuthorPhotoChange(url); setOpen(false); }
    };

    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">
                Foto del autor <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-slate-200">
                    {authorPhoto
                        ? <Image src={authorPhoto} alt={authorName} width={40} height={40} className="object-cover w-full h-full" />
                        : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold">{initials}</div>
                    }
                </div>
                {!isLocked && (
                    <div className="flex flex-col gap-1">
                        <button onClick={() => setOpen(true)}
                            className="text-xs text-sky-600 hover:text-sky-800 font-medium transition-colors text-left">
                            {authorPhoto ? "Cambiar foto" : "Subir foto"}
                        </button>
                        {authorPhoto && (
                            <button onClick={() => onAuthorPhotoChange("")}
                                className="text-[10px] text-red-400 hover:text-red-600 transition-colors text-left">
                                Eliminar
                            </button>
                        )}
                    </div>
                )}
            </div>

            {open && !isLocked && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-5 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800">Foto del autor</h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">Imagen cuadrada recomendada</p>
                            </div>
                            <button onClick={() => setOpen(false)}
                                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors text-sm">✕</button>
                        </div>
                        {authorPhoto && (
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-slate-200">
                                    <Image src={authorPhoto} alt={authorName} width={48} height={48} className="object-cover w-full h-full" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-600 font-medium">{authorName || "Autor"}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Foto actual · sube otra para reemplazar</p>
                                </div>
                            </div>
                        )}
                        <div className="border-2 border-dashed border-slate-200 rounded-lg overflow-hidden hover:border-sky-300 transition-colors">
                            <FileUpload endpoint="courseImage" action={handleUpload} />
                        </div>
                        <button onClick={() => setOpen(false)}
                            className="w-full py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export function PanelRight({
    title, subtitle, hookPhrase, authorName, authorBio, authorPhoto, authorSocialPlatform, authorSocialUrl,
    status, viewCount, coverImageUrl,
    isPublishing, isDeleting, isLocked, canPublish, hasValidTextBlock, hasBodyImage,
    onHookPhraseChange, onTitleChange, onSubtitleChange, onAuthorNameChange, onAuthorBioChange,
    onAuthorPhotoChange, onAuthorSocialPlatformChange, onAuthorSocialUrlChange,
    onPublish, onDelete, onGoToList,
}: PanelRightProps) {

    // Cuando está bloqueado, los inputs son solo lectura visualmente
    const inputCls = [
        "w-full px-3 py-2 border border-slate-200 rounded-md text-sm bg-slate-50 outline-none transition-colors",
        isLocked
            ? "opacity-60 cursor-not-allowed"
            : "focus:border-sky-500 focus:bg-white",
    ].join(" ");
    const labelCls   = "text-xs font-medium text-slate-600 mb-1 block";
    const sectionCls = "flex flex-col gap-1";

    const publishBlockers: string[] = [];
    if (!title.trim())      publishBlockers.push("título");
    if (!authorName.trim()) publishBlockers.push("nombre del autor");
    if (!coverImageUrl)     publishBlockers.push("foto de portada");
    if (!hasValidTextBlock && !hasBodyImage)
        publishBlockers.push("contenido (parrafo, lista o imagen)");

    const initials = authorName ? authorName.slice(0, 2).toUpperCase() : "AU";

    return (
        <aside className="w-[272px] flex-shrink-0 bg-white border-l border-slate-200 flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

                {/* Status */}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className={["w-2 h-2 rounded-full flex-shrink-0",
                        status === "published" ? "bg-emerald-500" :
                        status === "archived"  ? "bg-slate-400"   : "bg-amber-400 animate-pulse"
                    ].join(" ")} />
                    <span className="font-medium">
                        {status === "published" ? "Publicado" : status === "archived" ? "Archivado" : "Borrador"}
                    </span>
                    <span className="ml-auto flex items-center gap-1 text-slate-400">
                        <Eye className="w-3 h-3" />{viewCount}
                    </span>
                </div>

                {/* Banner solo lectura */}
                {isLocked && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2 text-[11px] text-emerald-700 leading-snug">
                        Este artículo está publicado y no puede editarse. Para modificarlo, archívalo primero.
                    </div>
                )}

                <hr className="border-slate-100" />

                {/* Título */}
                <div className={sectionCls}>
                    <label className={labelCls}>Título</label>
                    <input value={title} onChange={(e) => onTitleChange(e.target.value)}
                        maxLength={CHAR_LIMITS.title} placeholder="Título del artículo"
                        disabled={isLocked} className={inputCls} />
                    <span className={`text-[10px] text-right ${charColor(title.length, CHAR_LIMITS.title)}`}>
                        {title.length}/{CHAR_LIMITS.title}
                    </span>
                </div>

                {/* Subtítulo */}
                <div className={sectionCls}>
                    <label className={labelCls}>
                        Subtítulo <span className="font-normal text-slate-400">(opcional)</span>
                    </label>
                    <textarea value={subtitle} onChange={(e) => onSubtitleChange(e.target.value)}
                        rows={2} maxLength={CHAR_LIMITS.subtitle} placeholder="Descripción breve..."
                        disabled={isLocked} className={inputCls + " resize-none"} />
                    <span className={`text-[10px] text-right ${charColor(subtitle.length, CHAR_LIMITS.subtitle)}`}>
                        {subtitle.length}/{CHAR_LIMITS.subtitle}
                    </span>
                </div>


                {/* Frase de gancho */}
                <div className={sectionCls}>
                    <label className={labelCls}>
                        Frase de gancho <span className="font-normal text-slate-400">(opcional)</span>
                    </label>
                    <input value={hookPhrase} onChange={(e) => onHookPhraseChange(e.target.value)}
                        maxLength={CHAR_LIMITS.hookPhrase}
                        placeholder='¿Qué descubrirás en este artículo?'
                        disabled={isLocked} className={inputCls} />
                    <span className={`text-[10px] text-right ${charColor(hookPhrase.length, CHAR_LIMITS.hookPhrase)}`}>
                        {hookPhrase.length}/{CHAR_LIMITS.hookPhrase}
                    </span>
                    <p className="text-[10px] text-slate-400 leading-snug">
                        Aparece entre comillas en el feed para generar intriga.
                    </p>
                </div>

                <hr className="border-slate-100" />

                {/* Autor */}
                <div className={sectionCls}>
                    <label className={labelCls}>Nombre del autor</label>
                    <input value={authorName} onChange={(e) => onAuthorNameChange(e.target.value)}
                        placeholder="Nombre completo" disabled={isLocked} className={inputCls} />
                </div>

                {/* Foto del autor */}
                <AuthorPhotoField
                    authorPhoto={authorPhoto}
                    authorName={authorName}
                    initials={initials}
                    isLocked={isLocked}
                    onAuthorPhotoChange={onAuthorPhotoChange}
                />

                {/* Bio */}
                <div className={sectionCls}>
                    <label className={labelCls}>
                        Bio <span className="font-normal text-slate-400">(opcional)</span>
                    </label>
                    <textarea value={authorBio} onChange={(e) => onAuthorBioChange(e.target.value)}
                        rows={2} placeholder="Descripción breve del autor..."
                        disabled={isLocked} className={inputCls + " resize-none"} />
                </div>

                {/* Red social */}
                <div className={sectionCls}>
                    <label className={labelCls}>
                        Red social <span className="font-normal text-slate-400">(opcional)</span>
                    </label>
                    <select value={authorSocialPlatform}
                        onChange={(e) => onAuthorSocialPlatformChange(e.target.value as SocialPlatform | "")}
                        disabled={isLocked} className={inputCls}>
                        <option value="">Sin red social</option>
                        {SOCIAL_OPTIONS.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </div>

                {authorSocialPlatform && (
                    <div className={sectionCls}>
                        <label className={labelCls}>URL / usuario</label>
                        <input value={authorSocialUrl}
                            onChange={(e) => onAuthorSocialUrlChange(e.target.value)}
                            placeholder={
                                authorSocialPlatform === "instagram" ? "@usuario" :
                                authorSocialPlatform === "x"         ? "@usuario" :
                                authorSocialPlatform === "github"    ? "github.com/usuario" : "https://"
                            }
                            disabled={isLocked} className={inputCls} />
                    </div>
                )}

                <hr className="border-slate-100" />

                {/* Portada status */}
                <div className={["flex items-center gap-2 text-xs px-3 py-2 rounded-md",
                    coverImageUrl
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                ].join(" ")}>
                    <span>{coverImageUrl ? "✓" : "!"}</span>
                    <span>{coverImageUrl ? "Foto de portada lista" : "Foto de portada requerida"}</span>
                </div>

                {/* Acciones según estado */}
                {isLocked ? (
                    // Publicado: solo archivar (no puede volver a borrador directamente)
                    <button onClick={() => onPublish("archive")} disabled={isPublishing}
                        className="w-full py-2 border border-slate-200 text-sm text-slate-600 rounded-md hover:border-slate-400 transition-colors disabled:opacity-50">
                        {isPublishing ? "Archivando..." : "Archivar artículo"}
                    </button>
                ) : status === "archived" ? (
                    // Archivado: puede republicar o volver a borrador
                    <div className="flex flex-col gap-2">
                        <button onClick={() => onPublish("publish")} disabled={!canPublish || isPublishing}
                            className="w-full py-2.5 bg-sky-600 text-white text-sm font-medium rounded-md hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            {isPublishing ? "Publicando..." : "Publicar artículo"}
                        </button>
                        <button onClick={() => onPublish("unpublish")} disabled={isPublishing}
                            className="w-full py-2 border border-slate-200 text-sm text-slate-600 rounded-md hover:border-slate-400 transition-colors disabled:opacity-50">
                            Volver a borrador
                        </button>
                    </div>
                ) : (
                    // Borrador: puede publicar
                    <button onClick={() => onPublish("publish")}
                        disabled={!canPublish || isPublishing}
                        className="w-full py-2.5 bg-sky-600 text-white text-sm font-medium rounded-md hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        {isPublishing ? "Publicando..." : "Publicar artículo"}
                    </button>
                )}

                {publishBlockers.length > 0 && !isLocked && status !== "published" && (
                    <p className="text-[10px] text-slate-400 text-center leading-relaxed -mt-2">
                        Falta: {publishBlockers.join(", ")}
                    </p>
                )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-slate-100 p-3 flex flex-col gap-2">
                <button onClick={onGoToList}
                    className="w-full py-2 text-sm text-slate-500 hover:text-slate-800 border border-slate-200 rounded-md hover:border-slate-300 bg-white transition-colors">
                    Listado de artículos
                </button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <button disabled={isDeleting}
                            className="w-full py-2 text-sm text-red-500 hover:text-red-700 border border-red-100 hover:border-red-300 hover:bg-red-50 rounded-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
                            <Trash2 className="w-3.5 h-3.5" />
                            {isDeleting ? "Eliminando..." : "Eliminar artículo"}
                        </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar este artículo?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente{" "}
                                <strong>&ldquo;{title || "Sin título"}&rdquo;</strong> y todas sus vistas.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700 text-white">
                                Sí, eliminar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </aside>
    );
}
