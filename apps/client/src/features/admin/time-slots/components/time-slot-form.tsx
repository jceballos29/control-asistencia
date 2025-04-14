import { useForm } from "@tanstack/react-form";
import {
  CreateTimeSlotInput,
  UpdateTimeSlotInput,
} from "../schema"; // Schema/Tipo del Slot
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";
import { z } from "zod";
import { formatTimeAmPm } from "@/lib/utils";

type TimeSlotFormData = CreateTimeSlotInput | UpdateTimeSlotInput;
type TimeSlotFormSchema = z.ZodSchema<TimeSlotFormData>;

interface TimeSlotFormProps {
  onSubmit: (data: TimeSlotFormData) => Promise<void> | void;
  onCancel?: () => void;
  isPending?: boolean;
  defaultValues?: TimeSlotFormData;
  officeStartTime: string; // Hora inicio oficina 'HH:MM:SS'
  officeEndTime: string;
  submitButtonText: string;
  schema: TimeSlotFormSchema;
}

export function TimeSlotForm({
  onSubmit,
  onCancel,
  defaultValues = { startTime: "", endTime: "" },
  isPending = false,
  officeStartTime,
  officeEndTime,
  schema,
  submitButtonText = "Agregar Franja",
}: TimeSlotFormProps) {
  // --- Crear Schema Dinámicamente con useMemo ---
  const dynamicTimeSlotSchema = React.useMemo(() => {
    // let schema = baseTimeSlotSchema; // Empieza con la validación base (formato, end > start)

    // Añade validación contra el INICIO de la oficina si existe
    if (officeStartTime) {
      schema = schema.refine(
        (data) => {
            if (!data.startTime) return true; // Pasa si no hay valor aún
            return data.startTime >= officeStartTime; // Compara como string
        },
        {
          message: `La hora de inicio debe ser igual o posterior a las ${formatTimeAmPm(officeStartTime) || officeStartTime}`, // Mensaje amigable
          path: ["startTime"], // Asocia al campo correcto
        }
      );
    }

    // Añade validación contra el FIN de la oficina si existe
    if (officeEndTime) {
      schema = schema.refine(
        (data) => {
             if (!data.endTime) return true; // Pasa si no hay valor aún
            return data.endTime <= officeEndTime; // Compara como string
        },
        {
          message: `La hora de fin debe ser igual o anterior a las ${formatTimeAmPm(officeEndTime) || officeEndTime}`, // Mensaje amigable
          path: ["endTime"], // Asocia al campo correcto
        }
      );
    }

    return schema;
  }, [officeStartTime, officeEndTime]); // Dependencias del useMemo

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: {
      onSubmit: dynamicTimeSlotSchema,
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
      <div className="grid grid-cols-2 gap-4">
        {/* Campo Start Time */}
        <form.Field
          name="startTime"
          children={(field) => (
            <div className="space-y-1">
              <Label htmlFor={field.name}>Hora Inicio</Label>
              <Input
                id={field.name}
                name={field.name}
                type="time"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                min={officeStartTime}
                max={officeEndTime}
                disabled={isPending}
                step="1"
                required
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
        {/* Campo End Time */}
        <form.Field
          name="endTime"
          children={(field) => (
            <div className="space-y-1">
              <Label htmlFor={field.name}>Hora Fin</Label>
              <Input
                id={field.name}
                name={field.name}
                type="time"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                min={officeStartTime}
                max={officeEndTime}
                disabled={isPending}
                step="1"
                required
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

      {/* Botones */}
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
              {/* Muestra estado de carga o el texto pasado/por defecto */}
              {isPending || isSubmitting ? "Guardando..." : submitButtonText}
            </Button>
          )}
        />
      </div>
    </form>
  );
}
