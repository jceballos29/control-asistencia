import { useForm } from "@tanstack/react-form";
import {
  createJobPositionSchema,
  type CreateJobPositionInput,
} from "../schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface JobPositionCreateFormProps {
  onSubmit: (data: CreateJobPositionInput) => Promise<void> | void;
  isPending?: boolean;
}

export function JobPositionCreateForm({
  onSubmit,
  isPending = false,
}: JobPositionCreateFormProps) {
  const form = useForm({
    defaultValues: { name: "", color: "#cccccc" },
    onSubmit: async ({ value }) => {
      await onSubmit(value as CreateJobPositionInput);
      form.reset();
    },
    validators: {
      onChange: createJobPositionSchema,
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="flex items-end gap-2"
    >
      <form.Field
        name="name"
        children={(field) => (
          <div className="space-y-1 flex-grow">
            <Label htmlFor={field.name} className="text-xs">
              Nuevo Puesto
            </Label>
            <Input
              id={field.name}
              name={field.name}
              type="text"
              placeholder="Nombre del puesto..."
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              disabled={isPending}
              className="h-9"
            />
            {field.state.meta.isTouched && field.state.meta.errors.length ? (
              <em role="alert" className="text-sm font-medium text-destructive">
                {field.state.meta.errors[0]?.message}
              </em>
            ) : null}
          </div>
        )}
      />
      <form.Field
        name="color"
        children={(field) => (
          <div className="space-y-1">
            <Label htmlFor={field.name} className="text-xs">
              Color
            </Label>
            <Input
              id={field.name}
              name={field.name}
              type="color"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              disabled={isPending}
              className="h-9 w-14 p-1"
            />
            {field.state.meta.isTouched && field.state.meta.errors.length ? (
              <em role="alert" className="text-sm font-medium text-destructive">
                {field.state.meta.errors[0]?.message}
              </em>
            ) : null}
          </div>
        )}
      />
      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <Button
            type="submit"
            disabled={!canSubmit || isSubmitting || isPending}
            size="sm"
            className="h-9"
          >
            {isPending || isSubmitting ? "Agregando..." : "Agregar"}
          </Button>
        )}
      />
    </form>
  );
}
