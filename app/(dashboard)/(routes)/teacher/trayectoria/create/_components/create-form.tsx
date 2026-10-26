"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ENTRY_TYPES, TYPE_LABELS, type EntryType } from "@/lib/timeline";
import { TYPE_STYLES } from "@/app/(dashboard)/(routes)/proyectos/_components/entry-type";
import { createEntry } from "@/actions/timeline";

const formSchema = z.object({
    type: z.enum(["project", "participation", "alliance"], {
        required_error: "Elige el tipo de registro",
    }),
    title: z.string().trim().min(1, {
        message: "El nombre es obligatorio",
    }),
});

/** Lo que cambia en la tarjeta según el tipo elegido. */
const TYPE_COPY: Record<
    EntryType,
    { hint: string; label: string; placeholder: string; description: string }
> = {
    project: {
        hint: "Un trabajo del aula con una comunidad o un territorio.",
        label: "Nombre del proyecto",
        placeholder: "Ejemplo: 'Entre Aguas'",
        description: "Escribe el nombre con el que se conoce el proyecto.",
    },
    participation: {
        hint: "Un evento o congreso en el que estuvo el aula.",
        label: "Nombre del evento y edición",
        placeholder: "Ejemplo: 'Congreso Nacional de Educación STEAM · 2025'",
        description: "Escribe el nombre del evento y, si tiene, su edición.",
    },
    alliance: {
        hint: "Un vínculo con una institución u organización.",
        label: "Institución u organización aliada",
        placeholder: "Ejemplo: 'Parque Explora'",
        description:
            "Elige una institución ya registrada o escribe el nombre completo de una nueva.",
    },
};

interface CreateFormProps {
    /** Instituciones ya registradas: una alianza se crea con una de ellas o con una nueva. */
    knownInstitutions: string[];
}

export const CreateForm = ({ knownInstitutions }: CreateFormProps) => {
    const router = useRouter();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        mode: "onChange",
        defaultValues: {
            title: "",
        },
    });

    const { isSubmitting, isValid } = form.formState;
    const selectedType = form.watch("type");
    const copy = TYPE_COPY[selectedType ?? "project"];

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        const result = await createEntry(values).catch(() => null);
        if (!result?.ok) {
            toast.error(result?.error ?? "Algo salió mal");
            return;
        }
        router.push(`/teacher/proyectos/${result.data.id}`);
        toast.success("Registro creado con éxito");
    };

    return (
        <div className="max-w-2xl mx-auto flex flex-col items-center justify-center h-full p-8">
            <div className="w-full bg-white dark:bg-gray-900 shadow-xl rounded-2xl p-8 border border-gray-200 dark:border-gray-800 backdrop-blur-md bg-opacity-80 dark:bg-opacity-70">
                <h1 className="text-3xl font-semibold text-gray-900 dark:text-white text-center">
                    Crea un registro
                </h1>
                <p className="text-md text-gray-600 dark:text-gray-400 text-center mt-2">
                    ¿Qué vas a agregar al mapa y a la línea de tiempo? El tipo no
                    se puede cambiar después; el nombre sí.
                </p>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 dark:text-gray-300">
                                        Tipo de registro
                                    </FormLabel>
                                    <FormControl>
                                        <div
                                            role="radiogroup"
                                            aria-label="Tipo de registro"
                                            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                                        >
                                            {ENTRY_TYPES.map((type) => {
                                                const style = TYPE_STYLES[type];
                                                const Icon = style.icon;
                                                const isSelected = field.value === type;
                                                return (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        role="radio"
                                                        aria-checked={isSelected}
                                                        disabled={isSubmitting}
                                                        onClick={() => field.onChange(type)}
                                                        className={cn(
                                                            "flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2 rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                                                            isSelected
                                                                ? "border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800 ring-1 ring-gray-900 dark:ring-white"
                                                                : "border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
                                                        )}
                                                    >
                                                        <span className={cn("shrink-0 rounded-full p-2", style.soft)}>
                                                            <Icon className="h-5 w-5" />
                                                        </span>
                                                        <span>
                                                            <span className="block font-medium text-gray-900 dark:text-white">
                                                                {TYPE_LABELS[type].singular}
                                                            </span>
                                                            <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                                {TYPE_COPY[type].hint}
                                                            </span>
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 dark:text-gray-300">
                                        {selectedType ? copy.label : "Nombre"}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            disabled={isSubmitting}
                                            placeholder={copy.placeholder}
                                            className="text-gray-900 dark:text-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                                            list={selectedType === "alliance" ? "known-institutions" : undefined}
                                            {...field}
                                        />
                                    </FormControl>
                                    <datalist id="known-institutions">
                                        {knownInstitutions.map((institution) => (
                                            <option key={institution} value={institution} />
                                        ))}
                                    </datalist>
                                    <FormDescription className="text-gray-500 dark:text-gray-400">
                                        {selectedType
                                            ? copy.description
                                            : "Elige primero el tipo de registro."}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex items-center gap-x-4 mt-4">
                            <Link href="/teacher/proyectos">
                                <Button
                                    type="button"
                                    variant="ghost"
                                >
                                    Cancelar
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                disabled={!isValid || isSubmitting}
                                aria-busy={isSubmitting}
                            >
                                {isSubmitting ? "Creando..." : "Continuar"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
};
