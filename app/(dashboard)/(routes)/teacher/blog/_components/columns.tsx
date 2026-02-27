"use client"

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Eye, Pencil } from 'lucide-react';
import Link from 'next/link';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';

type ArticleRow = {
    id:         string;
    slug:       string;
    title:      string;
    authorName: string;
    template:   string;
    status:     string;
    publishedAt: Date | null;
    _count: { views: number };
};

export const columns: ColumnDef<ArticleRow>[] = [
    {
        accessorKey: "title",
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                Título <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <span className="font-medium text-sm text-slate-800">
                {row.getValue("title") || <span className="text-slate-400 italic font-normal">Sin título</span>}
            </span>
        ),
    },
    {
        accessorKey: "authorName",
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                Autor <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const name = row.getValue("authorName") as string;
            return (
                <span className="text-sm text-slate-600">
                    {name || <span className="text-slate-400 italic">Sin definir</span>}
                </span>
            );
        },
    },
    {
        accessorKey: "template",
        header: "Plantilla",
        cell: ({ row }) => {
            const labels: Record<string, string> = {
                cover_person:   "Cover Personaje",
                full_article:   "Artículo Completo",
                profile_simple: "Perfil Simple",
                news_short:     "Noticia Corta",
            };
            return (
                <span className="text-sm text-slate-500">
                    {labels[row.getValue("template") as string] ?? row.getValue("template")}
                </span>
            );
        },
    },
    {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
            const status = row.getValue("status") as string;
            return (
                <Badge className={cn(
                    "bg-slate-500 text-white",
                    status === "published" && "bg-sky-700",
                    status === "archived"  && "bg-slate-400",
                )}>
                    {status === "published" ? "Publicado" : status === "archived" ? "Archivado" : "Borrador"}
                </Badge>
            );
        },
    },
    {
        id: "views",
        accessorFn: (row) => row._count.views,
        sortingFn: "basic",
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                Vistas
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <span className="text-sm text-slate-500 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 opacity-40" />
                {row.original._count.views.toLocaleString("es-CO")}
            </span>
        ),
    },
    {
        accessorKey: "publishedAt",
        header: ({ column }) => (
            <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                Publicado <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const date = row.getValue("publishedAt") as Date | null;
            if (!date) return <span className="text-slate-400 text-sm">—</span>;
            return (
                <span className="text-sm text-slate-600">
                    {new Date(date).toLocaleDateString("es-CO", {
                        day: "numeric", month: "short", year: "numeric",
                    })}
                </span>
            );
        },
    },
    {
        id: "actions",
        cell: ({ row }) => (
            <Link href={`/teacher/blog/${row.original.slug}`}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Pencil className="h-3.5 w-3.5" />
                </Button>
            </Link>
        ),
    },
];