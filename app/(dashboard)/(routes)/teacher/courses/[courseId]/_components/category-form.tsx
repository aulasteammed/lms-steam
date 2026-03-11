"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

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
import { cn } from "@/lib/utils";
import { Loading } from "@/components/loading";
import { Checkbox } from "@/components/ui/checkbox";

interface CategoryFormProps {
  initialCategoryIds: string[];
  courseId: string;
  options: { label: string; value: string }[];
}

const formSchema = z.object({
  categoryIds: z.array(z.string()).min(1, "Debes seleccionar al menos una categoría"),
});

export const CategoryForm = ({
  initialCategoryIds,
  courseId,
  options,
}: CategoryFormProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => setIsEditing((current) => !current);

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      categoryIds: initialCategoryIds || [],
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}`, {
        categoryIds: Array.from(new Set(values.categoryIds)),
      });
      toast.success("Curso actualizado correctamente");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("Algo salió mal");
    }
  };

  const selectedOptions = options.filter((option) =>
    initialCategoryIds.includes(option.value)
  );

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Categorías del curso
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing ? (
            <>Cancelar</>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Editar categorías
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <p
          className={cn(
            "text-sm mt-2",
            selectedOptions.length === 0 && "text-slate-500 italic"
          )}
        >
          {selectedOptions.length > 0
            ? selectedOptions.map((option) => option.label).join(", ")
            : "Sin categorías"}
        </p>
      )}
      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="categoryIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categorías</FormLabel>
                  <FormDescription>
                    Puedes seleccionar varias categorías, pero no repetidas.
                  </FormDescription>
                  <div className="space-y-3">
                    {options.map((option) => {
                      const isChecked = field.value.includes(option.value);

                      return (
                        <FormItem
                          key={option.value}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...field.value, option.value]);
                                  return;
                                }

                                field.onChange(
                                  field.value.filter((value) => value !== option.value)
                                );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {option.label}
                          </FormLabel>
                        </FormItem>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-x-2">
              <Button disabled={!isValid || isSubmitting} type="submit">
                {isSubmitting && <Loading />}
                Guardar
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};
