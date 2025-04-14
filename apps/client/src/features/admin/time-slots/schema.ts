import { z } from "zod";

// Schema para crear/validar un slot en el form
export const createTimeSlotSchema = z
  .object({
    startTime: z
      .string()
      .regex(
        /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/,
        "Hora inicio: Formato HH:MM o HH:MM:SS inválido"
      ),
    endTime: z
      .string()
      .regex(
        /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/,
        "Hora fin: Formato HH:MM o HH:MM:SS inválido"
      ),
  })
  .refine(
    (data) => {
      // Asegura que no estén vacíos antes de comparar si la regex no es suficiente
      if (!data.startTime || !data.endTime) return false;
      return data.endTime > data.startTime;
    },
    {
      message: "La hora de fin debe ser posterior a la hora de inicio",
      path: ["endTime"],
    }
  );

export type CreateTimeSlotInput = z.infer<typeof createTimeSlotSchema>;

export const updateTimeSlotSchema = z
  .object({
    startTime: z
      .string()
      .regex(
        /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/,
        "Hora inicio: Formato HH:MM o HH:MM:SS inválido"
      )
      .optional(),
    endTime: z
      .string()
      .regex(
        /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/,
        "Hora fin: Formato HH:MM o HH:MM:SS inválido"
      )
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.endTime > data.startTime;
      }
    },
    {
      message: "La hora de fin debe ser posterior a la hora de inicio",
      path: ["endTime"],
    }
  );
  
export type UpdateTimeSlotInput = z.infer<typeof updateTimeSlotSchema>;
