"use client"

import * as React from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input"
import { cn } from '@/lib/utils';
import { ENTRY_TYPES, TYPE_LABELS, type EntryType } from '@/lib/timeline';

import type { EntryRow } from './columns';

interface DataTableProps<TValue> {
    columns: ColumnDef<EntryRow, TValue>[]
    data: EntryRow[]
}

/**
 * Tabla de registros: la misma de cursos, con pestañas para ver un solo tipo.
 */
export function DataTable<TValue>({ columns, data }: DataTableProps<TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        []
    )

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
        },
    })

    const selectedType = (table.getColumn("type")?.getFilterValue() as EntryType | undefined) ?? null;
    const tabs: { value: EntryType | null; label: string; count: number }[] = [
        { value: null, label: "Todos", count: data.length },
        ...ENTRY_TYPES.map((type) => ({
            value: type,
            label: TYPE_LABELS[type].plural,
            count: data.filter((entry) => entry.type === type).length,
        })),
    ];

    return (
        <div>
            {/* Type tabs */}
            <div role="group" aria-label="Tipo de registro" className="flex flex-wrap gap-1 border-b">
                {tabs.map((tab) => {
                    const isSelected = tab.value === selectedType;
                    return (
                        <button
                            key={tab.label}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => table.getColumn("type")?.setFilterValue(tab.value ?? undefined)}
                            className={cn(
                                "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition",
                                isSelected
                                    ? "border-sky-700 text-sky-700"
                                    : "border-transparent text-slate-600 hover:text-slate-900",
                            )}
                        >
                            {tab.label}
                            <span className="ml-1.5 tabular-nums text-slate-400">{tab.count}</span>
                        </button>
                    );
                })}
            </div>

            {/* Filters and creation button */}
            <div className="flex items-center py-4 justify-between gap-x-4">
                <Input
                    placeholder="Filtrar registros..."
                    value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("title")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                <Link href="/teacher/proyectos/create" >
                    <Button>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Nuevo registro
                    </Button>
                </Link>
            </div>

            {/* Board */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
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
                                    No hay resultados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Anterior
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Siguiente
                </Button>
            </div>
        </div>
    )
}
