import { z } from "zod";
import { DayOfWeek } from "./types";

export const createOfficeSchema = z
  .object({
    name: z.string().min(1, { message: "El nombre es obligatorio." }).max(255),
    workStartTime: z
    .string() // Ya no es opcional
    .regex(
      /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/,
      "La hora de inicio laboral es obligatoria"
    ),
    workEndTime: z
    .string() 
    .regex(
      /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/,
      "La hora de fin laboral es obligatoria"
    ),

    workingDays: z.array(z.nativeEnum(DayOfWeek)).optional(),
  })
  .refine(
    (data) => {
      return data.workEndTime > data.workStartTime;
    },
    {
      message:
        "La hora de fin laboral debe ser posterior a la hora de inicio laboral",
      path: ["workEndTime"],
    }
  );

export type CreateOfficeInput = z.infer<typeof createOfficeSchema>;

export const updateOfficeSchema = z.object({
  name: z.string().min(1, { message: "El nombre es obligatorio." }).max(255).optional(),
  workStartTime: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/,
      "La hora de inicio laboral es obligatoria"
    )
    .optional(),
  workEndTime: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/,
      "La hora de fin laboral es obligatoria"
    )
    .optional(),
  workingDays: z.array(z.nativeEnum(DayOfWeek)).optional(),
}).refine(
  (data) => {
    if (data.workEndTime && data.workStartTime) {
      return data.workEndTime > data.workStartTime;
    }
    return true;
  },
  {
    message:
      "La hora de fin laboral debe ser posterior a la hora de inicio laboral",
    path: ["workEndTime"],
  }
);

export type UpdateOfficeInput = z.infer<typeof updateOfficeSchema>;