"use client"

import * as React from "react";
import {
    ColumnDef, ColumnFiltersState, SortingState,
    flexRender, getCoreRowModel, getFilteredRowModel,
    getPaginationRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data:    TData[];
}

export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
    const router = useRouter();
    const [sorting,       setSorting]       = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [isCreating,    setIsCreating]    = React.useState(false);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel:       getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange:       setSorting,
        getSortedRowModel:     getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel:   getFilteredRowModel(),
        state: { sorting, columnFilters },
    });

    const onCreateArticle = async () => {
        try {
            setIsCreating(true);
            const response = await axios.post("/api/blog/articles", { title: "Sin título" });
            router.push(`/teacher/blog/${response.data.slug}`);
        } catch {
            toast.error("No se pudo crear el artículo");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div>
            <div className="flex items-center py-4 justify-between">
                <Input
                    placeholder="Filtrar artículos..."
                    value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
                    onChange={(e) => table.getColumn("title")?.setFilterValue(e.target.value)}
                    className="max-w-sm"
                />
                <Button onClick={onCreateArticle} disabled={isCreating}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    {isCreating ? "Creando..." : "Nuevo artículo"}
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder ? null : flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="px-4 py-3">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No hay artículos todavía.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-end space-x-2 py-4">
                <Button variant="outline" size="sm"
                    onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                    Anterior
                </Button>
                <Button variant="outline" size="sm"
                    onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                    Siguiente
                </Button>
            </div>
        </div>
    );
}