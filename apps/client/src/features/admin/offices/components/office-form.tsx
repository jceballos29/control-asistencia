import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useForm } from "@tanstack/react-form";
import {
  CreateOfficeInput,
  UpdateOfficeInput,
} from "../schema";
import { DayOfWeek, daysOfWeekOptions } from "../types";
import { Button } from "@/components/ui/button";
import { z } from "zod";

type OfficeFormData = CreateOfficeInput | UpdateOfficeInput;
type OfficeFormSchema = z.ZodSchema<OfficeFormData>;

interface OfficeUpsertFormProps {
  onSubmit: (data: OfficeFormData) => Promise<void> | void;
  onCancel?: () => void;
  isPending?: boolean;
  defaultValues?: Partial<OfficeFormData>;
  schema: OfficeFormSchema;
  submitLabel?: string;
}

function OfficeUpsertForm({
  onSubmit,
  onCancel,
  isPending = false,
  defaultValues = {},
  schema,
  submitLabel = "Guardar",
}: OfficeUpsertFormProps) {
  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: {
      onSubmit: schema,
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <form.Field
        name="name"
        children={(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Nombre</Label>
            <Input
              id={field.name}
              name={field.name}
              type="text"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              disabled={isPending}
              placeholder="Nombre del consultorio"
            />
            {field.state.meta.isTouched && field.state.meta.errors.length ? (
              <em role="alert" className="text-sm font-medium text-destructive">
                {field.state.meta.errors[0]?.message}
              </em>
            ) : null}
          </div>
        )}
      />
      <div className="grid grid-cols-2 gap-4">
        <form.Field
          name="workStartTime"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Hora de inicio</Label>
              <Input
                id={field.name}
                name={field.name}
                type="time"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                disabled={isPending}
                step="1"
              />
              {field.state.meta.isTouched && field.state.meta.errors.length ? (
                <em
                  role="alert"
                  className="text-sm font-medium text-destructive"
                >
                  {field.state.meta.errors[0]?.message}
                </em>
              ) : null}
            </div>
          )}
        />
        <form.Field
          name="workEndTime"
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Hora de fin</Label>
              <Input
                id={field.name}
                name={field.name}
                type="time"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                disabled={isPending}
                step="1"
              />
              {field.state.meta.isTouched && field.state.meta.errors.length ? (
                <em
                  role="alert"
                  className="text-sm font-medium text-destructive"
                >
                  {field.state.meta.errors[0]?.message}
                </em>
              ) : null}
            </div>
          )}
        />
      </div>
      <form.Field
        name="workingDays"
        children={(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Días Laborales</Label>
            <ToggleGroup
              type="multiple"
              variant="outline"
              className="justify-between"
              value={field.state.value || []}
              onValueChange={(value) => {
                const valueAsArray = value.map((v) => v as DayOfWeek);
                field.handleChange(valueAsArray);
              }}
              disabled={isPending}
            >
              {daysOfWeekOptions.map((day) => (
                <ToggleGroupItem
                  key={day.value}
                  value={day.value}
                  className="text-xs w-full"
                >
                  {day.abbr}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {field.state.meta.isTouched && field.state.meta.errors.length ? (
              <em role="alert" className="text-sm font-medium text-destructive">
                {field.state.meta.errors[0]?.message}
              </em>
            ) : null}
          </div>
        )}
      />
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting || isPending}
            >
              {isPending || isSubmitting ? "Guardando..." : submitLabel}
            </Button>
          )}
        />
      </div>
    </form>
  );
}

export default OfficeUpsertForm;
