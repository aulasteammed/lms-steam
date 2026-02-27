"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import type { Article } from "@prisma/client";

import { Block, BlockType, Template, SocialPlatform, uid, MAX_IMAGES } from "./types";
import { PanelLeft }                   from "./panel-left";
import { ArticleCanvas, TemplateProps } from "./canvas";
import { PanelRight }                  from "./panel-right";

interface ArticleWithCount extends Article {
    _count: { views: number };
}

export function ArticleEditor({ article }: { article: ArticleWithCount }) {
    const router = useRouter();

    // ── State ──────────────────────────────────────────────────────────────────
    const [title,                setTitle]                = useState(article.title);
    const [subtitle,             setSubtitle]             = useState(article.subtitle ?? "");
    const [authorName,           setAuthorName]           = useState(article.authorName);
    const [authorBio,            setAuthorBio]            = useState(article.authorBio ?? "");
    const [authorPhoto,          setAuthorPhoto]          = useState(article.authorPhoto ?? "");
    const [authorSocialPlatform, setAuthorSocialPlatform] = useState<SocialPlatform | "">((article.authorSocialPlatform as SocialPlatform) ?? "");
    const [authorSocialUrl,      setAuthorSocialUrl]      = useState(article.authorSocialUrl ?? "");
    const [coverImage,           setCoverImage]           = useState(article.coverImage ?? "");
    const [template,             setTemplate]             = useState<Template>(article.template as Template);
    const [accentColor,          setAccentColor]          = useState(article.accentColor);
    const [darkColor,            setDarkColor]            = useState(article.darkColColor);
    const [blocks,               setBlocks]               = useState<Block[]>(() =>
        Array.isArray(article.blocks)
            ? (article.blocks as unknown as Block[]).sort((a, b) => a.position - b.position)
            : []
    );
    const [status,       setStatus]       = useState(article.status);
    const [isSaving,     setIsSaving]     = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isDeleting,   setIsDeleting]   = useState(false);
    const [lastSaved,    setLastSaved]    = useState<Date | null>(null);
    const [dragging,     setDragging]     = useState<string | null>(null);
    const [dragOver,     setDragOver]     = useState<string | null>(null);

    const saveTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Slug actual en ref — no dispara re-renders pero siempre tiene el valor
    // mas reciente, incluso despues de que el servidor lo regenere
    const currentSlug = useRef<string>(article.slug);

    // ── Auto-save ──────────────────────────────────────────────────────────────
    const triggerSave = useCallback(() => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(async () => {
            try {
                setIsSaving(true);
                const res = await axios.put(
                    `/api/blog/articles/${currentSlug.current}`,
                    {
                        title, subtitle,
                        authorName, authorBio, authorPhoto,
                        authorSocialPlatform: authorSocialPlatform || null,
                        authorSocialUrl:      authorSocialUrl      || null,
                        coverImage,
                        template, accentColor, darkColColor: darkColor,
                        blocks: blocks.map((b, i) => ({ ...b, position: i })),
                    }
                );

                // El servidor regenera el slug cuando el articulo es borrador
                // y el titulo cambia — actualizar URL sin recargar la pagina
                if (res.data.newSlug && res.data.newSlug !== currentSlug.current) {
                    currentSlug.current = res.data.newSlug;
                    router.replace(
                        `/teacher/blog/${res.data.newSlug}`,
                        { scroll: false }
                    );
                }

                setLastSaved(new Date());
            } catch {
                toast.error("Error al guardar");
            } finally {
                setIsSaving(false);
            }
        }, 1500);
    }, [
        title, subtitle, authorName, authorBio, authorPhoto,
        coverImage, authorSocialPlatform, authorSocialUrl,
        template, accentColor, darkColor, blocks,
    ]);

    useEffect(() => { triggerSave(); }, [triggerSave]);

    // ── Block operations ───────────────────────────────────────────────────────
    const imageBlockCount = blocks.filter((b) => b.type === "image").length;

    const addBlock = (type: BlockType) => {
        if (type === "image" && imageBlockCount + 1 >= MAX_IMAGES) {
            toast.error(`Maximo ${MAX_IMAGES} imagenes por articulo (incluida la portada)`);
            return;
        }
        setBlocks((prev) => [...prev, {
            id: uid(), type,
            content: "",
            imagePosition: type === "image" ? "fw" : undefined,
            position: prev.length,
        }]);
    };

    const updateBlock = (id: string, patch: Partial<Block>) =>
        setBlocks((prev) => prev.map((b) => b.id === id ? { ...b, ...patch } : b));

    const removeBlock = (id: string) =>
        setBlocks((prev) => prev.filter((b) => b.id !== id));

    const moveBlock = (id: string, dir: -1 | 1) => {
        setBlocks((prev) => {
            const idx    = prev.findIndex((b) => b.id === id);
            const newIdx = idx + dir;
            if (newIdx < 0 || newIdx >= prev.length) return prev;
            const next = [...prev];
            [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
            return next;
        });
    };

    const onDragStart = (id: string) => setDragging(id);
    const onDragOver  = (id: string) => setDragOver(id);
    const onDrop      = (id: string) => {
        if (!dragging || dragging === id) return;
        setBlocks((prev) => {
            const from = prev.findIndex((b) => b.id === dragging);
            const to   = prev.findIndex((b) => b.id === id);
            const next = [...prev];
            const [item] = next.splice(from, 1);
            next.splice(to, 0, item);
            return next;
        });
        setDragging(null);
        setDragOver(null);
    };

    // ── Publish / delete ───────────────────────────────────────────────────────
    const handlePublish = async (action: "publish" | "unpublish" | "archive") => {
        try {
            setIsPublishing(true);
            const res = await axios.patch(
                `/api/blog/articles/${currentSlug.current}/publish`,
                { action }
            );
            setStatus(res.data.status);
            toast.success(
                action === "publish" ? "Articulo publicado" :
                action === "archive" ? "Articulo archivado" : "Vuelto a borrador"
            );
            router.refresh();
        } catch {
            toast.error("Error al cambiar estado");
        } finally {
            setIsPublishing(false);
        }
    };

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            await axios.delete(`/api/blog/articles/${currentSlug.current}`);
            toast.success("Articulo eliminado");
            router.push("/teacher/blog");
            router.refresh();
        } catch {
            toast.error("Error al eliminar el articulo");
            setIsDeleting(false);
        }
    };

    // ── Derived ────────────────────────────────────────────────────────────────
    const canPublish   = !!(title.trim() && authorName.trim() && coverImage);
    const dragHandlers = { onDragStart, onDragOver, onDrop };
    const dragState    = { dragging, dragOver };

    const canvasProps: TemplateProps = {
        title, subtitle,
        authorName, authorBio, authorPhoto,
        authorSocialPlatform, authorSocialUrl,
        coverImageUrl: coverImage,
        accentColor,
        onTitleChange:    setTitle,
        onSubtitleChange: setSubtitle,
        onCoverUpload:    setCoverImage,
        blocks,
        onBlockUpdate: updateBlock,
        onBlockRemove: removeBlock,
        onBlockMove:   moveBlock,
        dragHandlers,
        dragState,
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-1 min-h-0 overflow-hidden">
            <PanelLeft
                template={template}
                accentColor={accentColor}
                darkColor={darkColor}
                imageCount={imageBlockCount}
                coverImageUrl={coverImage}
                onTemplateChange={setTemplate}
                onAccentColorChange={setAccentColor}
                onDarkColorChange={setDarkColor}
                onAddBlock={addBlock}
            />

            <ArticleCanvas
                {...canvasProps}
                template={template}
                darkColor={darkColor}
                isSaving={isSaving}
                lastSaved={lastSaved}
            />

            <PanelRight
                title={title}
                subtitle={subtitle}
                authorName={authorName}
                authorBio={authorBio}
                authorPhoto={authorPhoto}
                authorSocialPlatform={authorSocialPlatform}
                authorSocialUrl={authorSocialUrl}
                status={status}
                viewCount={article._count.views}
                coverImageUrl={coverImage}
                isPublishing={isPublishing}
                isDeleting={isDeleting}
                canPublish={canPublish}
                onTitleChange={setTitle}
                onSubtitleChange={setSubtitle}
                onAuthorNameChange={setAuthorName}
                onAuthorBioChange={setAuthorBio}
                onAuthorPhotoChange={setAuthorPhoto}
                onAuthorSocialPlatformChange={setAuthorSocialPlatform}
                onAuthorSocialUrlChange={setAuthorSocialUrl}
                onPublish={handlePublish}
                onDelete={handleDelete}
                onGoToList={() => router.push("/teacher/blog")}
            />
        </div>
    );
}