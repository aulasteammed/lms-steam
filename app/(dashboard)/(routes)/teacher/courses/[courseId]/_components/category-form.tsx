"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Category, Course, CourseCategory } from "@prisma/client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loading } from '@/components/loading';
import { Checkbox } from "@/components/ui/checkbox";

interface CategoryFormProps {
  initialData: Course & {
    courseCategories: (CourseCategory & {
      category: Category;
    })[];
  };
  courseId: string;
  options: { label: string; value: string }[];
}

/**
 * A form component for managing the category of a course. It allows users to view and edit the course's category.
 * Includes a combobox for selecting a category from available options, and a button to toggle between editing and viewing states.
 * After submitting, the course category is updated, and the changes are reflected in the UI.
 */
const formSchema = z.object({
  categoryIds: z.array(z.string()).min(1, "Selecciona al menos una categoría"),
});

export const CategoryForm = ({
  initialData,
  courseId,
  options,
}: CategoryFormProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => setIsEditing((current) => !current);

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryIds: initialData.courseCategories.map((item) => item.categoryId),
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}`, values);
      toast.success("Curso actualizado correctamente");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("Algo salió mal");
    }
  };

  const selectedOptions = options.filter((option) =>
    initialData.courseCategories.some((item) => item.categoryId === option.value)
  );

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Categoría del curso
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing ? (
            <>Cancelar</>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Editar categoría
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <p
          className={cn(
            "text-sm mt-2",
            initialData.courseCategories.length === 0 && "text-slate-500 italic"
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
                <FormItem className="space-y-3">
                  <FormControl>
                    <div className="space-y-2 rounded-md border bg-white p-3">
                      {options.map((option) => {
                        const checked = field.value?.includes(option.value);

                        return (
                          <label
                            key={option.value}
                            className="flex items-center gap-3 text-sm"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(nextChecked) => {
                                const current = Array.isArray(field.value) ? field.value : [];
                                if (nextChecked === true) {
                                  field.onChange(Array.from(new Set([...current, option.value])));
                                  return;
                                }

                                field.onChange(
                                  current.filter((value) => value !== option.value)
                                );
                              }}
                            />
                            <span>{option.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </FormControl>
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
