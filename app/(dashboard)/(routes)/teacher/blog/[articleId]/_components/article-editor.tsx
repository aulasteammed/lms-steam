"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import type { Article } from "@prisma/client";

import { Block, BlockType, Template, SocialPlatform, uid, MAX_IMAGES, LIST_ITEM_MIN } from "./types";
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
    const [hookPhrase,           setHookPhrase]           = useState(article.hookPhrase ?? "");
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
    const currentSlug = useRef<string>(article.slug);

    // Artículo publicado = solo lectura, no se puede editar
    const isLocked = status === "published";

    // ── Auto-save — solo si no está bloqueado ──────────────────────────────────
    const triggerSave = useCallback(() => {
        if (isLocked) return;
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(async () => {
            try {
                setIsSaving(true);
                const res = await axios.put(
                    `/api/blog/articles/${currentSlug.current}`,
                    {
                        title, subtitle, hookPhrase,
                        authorName, authorBio, authorPhoto,
                        authorSocialPlatform: authorSocialPlatform || null,
                        authorSocialUrl:      authorSocialUrl      || null,
                        coverImage,
                        template, accentColor, darkColColor: darkColor,
                        blocks: blocks.map((b, i) => ({ ...b, position: i })),
                    }
                );
                if (res.data.newSlug && res.data.newSlug !== currentSlug.current) {
                    currentSlug.current = res.data.newSlug;
                    router.replace(`/teacher/blog/${res.data.newSlug}`, { scroll: false });
                }
                setLastSaved(new Date());
            } catch {
                toast.error("Error al guardar");
            } finally {
                setIsSaving(false);
            }
        }, 1500);
    }, [
        isLocked,
        title, subtitle, hookPhrase, authorName, authorBio, authorPhoto,
        coverImage, authorSocialPlatform, authorSocialUrl,
        template, accentColor, darkColor, blocks,
    ]);

    useEffect(() => { triggerSave(); }, [triggerSave]);

    // ── Block operations — no-op si está bloqueado ─────────────────────────────
    const imageBlockCount = blocks.filter((b) => b.type === "image").length;

    const addBlock = (type: BlockType) => {
        if (isLocked) return;
        if (type === "image" && imageBlockCount + 1 >= MAX_IMAGES) {
            toast.error(`Maximo ${MAX_IMAGES} imagenes por articulo (incluida la portada)`);
            return;
        }
        setBlocks((prev) => [...prev, {
            id:            uid(),
            type,
            content:       "",
            items:         type === "list" ? [""] : undefined,
            imagePosition: type === "image" ? "fw" : undefined,
            position:      prev.length,
        }]);
    };

    const updateBlock = (id: string, patch: Partial<Block>) => {
        if (isLocked) return;
        setBlocks((prev) => prev.map((b) => b.id === id ? { ...b, ...patch } : b));
    };

    const removeBlock = (id: string) => {
        if (isLocked) return;
        setBlocks((prev) => prev.filter((b) => b.id !== id));
    };

    const moveBlock = (id: string, dir: -1 | 1) => {
        if (isLocked) return;
        setBlocks((prev) => {
            const idx    = prev.findIndex((b) => b.id === id);
            const newIdx = idx + dir;
            if (newIdx < 0 || newIdx >= prev.length) return prev;
            const next = [...prev];
            [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
            return next;
        });
    };

    const onDragStart = (id: string) => { if (!isLocked) setDragging(id); };
    const onDragEnd   = ()            => { setDragging(null); setDragOver(null); };
    const onDragOver  = (id: string) => { if (!isLocked) setDragOver(id); };
    const onDrop      = (id: string) => {
        if (isLocked || !dragging || dragging === id) return;
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
    const PARAGRAPH_MIN = 10;
    const hasValidParagraph = blocks.some((b) =>
        b.type === "paragraph" && (b.content ?? "").trim().length >= PARAGRAPH_MIN
    );
    const hasValidList = blocks.some((b) =>
        b.type === "list" && Array.isArray(b.items) && b.items.some((i) => (i ?? "").trim().length >= LIST_ITEM_MIN)
    );
    const hasValidTextBlock = hasValidParagraph || hasValidList;
    const hasBodyImage = blocks.some((b) => b.type === "image" && (b.imageUrl ?? "").trim().length > 0);
    const hasValidContent = hasValidTextBlock || hasBodyImage;

    const canPublish = !isLocked && !!(
        title.trim() &&
        authorName.trim() &&
        coverImage &&
        hasValidContent
    );
    const dragHandlers = { onDragStart, onDragEnd, onDragOver, onDrop };
    const dragState    = { dragging, dragOver };

    const canvasProps: TemplateProps = {
        title, subtitle, 
        authorName, authorBio, authorPhoto,
        authorSocialPlatform, authorSocialUrl,
        coverImageUrl: coverImage,
        accentColor,
        // Si está bloqueado, los handlers de edición son no-op
        onTitleChange:    isLocked ? () => {} : setTitle,
        onSubtitleChange: isLocked ? () => {} : setSubtitle,
        onCoverUpload:    isLocked ? () => {} : setCoverImage,
        blocks,
        onBlockUpdate: updateBlock,
        onBlockRemove: removeBlock,
        onBlockMove:   moveBlock,
        dragHandlers,
        dragState,
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-1 min-h-0 overflow-hidden h-full">
            <PanelLeft
                template={template}
                accentColor={accentColor}
                darkColor={darkColor}
                imageCount={imageBlockCount}
                coverImageUrl={coverImage}
                isLocked={isLocked}
                onTemplateChange={isLocked ? () => {} : setTemplate}
                onAccentColorChange={isLocked ? () => {} : setAccentColor}
                onDarkColorChange={isLocked ? () => {} : setDarkColor}
                onAddBlock={addBlock}
            />

            <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="flex min-h-0">
                    <div className="flex-1 min-h-0">
                        <ArticleCanvas
                            {...canvasProps}
                            template={template}
                            darkColor={darkColor}
                            isSaving={isSaving}
                            lastSaved={lastSaved}
                            isLocked={isLocked}
                        />
                    </div>

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
                        hookPhrase={hookPhrase}
                        isPublishing={isPublishing}
                        isDeleting={isDeleting}
                        isLocked={isLocked}
                        canPublish={canPublish}
                        hasValidTextBlock={hasValidTextBlock}
                        hasBodyImage={hasBodyImage}
                        onTitleChange={isLocked ? () => {} : setTitle}
                        onSubtitleChange={isLocked ? () => {} : setSubtitle}
                        onHookPhraseChange={isLocked ? () => {} : setHookPhrase}
                        onAuthorNameChange={isLocked ? () => {} : setAuthorName}
                        onAuthorBioChange={isLocked ? () => {} : setAuthorBio}
                        onAuthorPhotoChange={isLocked ? () => {} : setAuthorPhoto}
                        onAuthorSocialPlatformChange={isLocked ? () => {} : setAuthorSocialPlatform}
                        onAuthorSocialUrlChange={isLocked ? () => {} : setAuthorSocialUrl}
                        onPublish={handlePublish}
                        onDelete={handleDelete}
                        onGoToList={() => router.push("/teacher/blog")}
                    />
                </div>
            </div>
        </div>
    );
}
