import { z } from "zod";

export const createJobPositionSchema = z.object({
  name: z.string().min(1, { message: "El nombre es obligatorio." }).max(100),
  color: z
    .string()
    .min(1, { message: "Debe seleccionar un color." })
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Color hexadecimal inválido"),
});

export type CreateJobPositionInput = z.infer<typeof createJobPositionSchema>;

export const updateJobPositionSchema = z.object({
  name: z
    .string()
    .min(1, { message: "El nombre es obligatorio." })
    .max(100)
    .optional(),
  color: z.string().min(1, { message: "Debe seleccionar un color." }),
});

export type UpdateJobPositionInput = z.infer<typeof updateJobPositionSchema>;
