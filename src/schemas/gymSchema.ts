import { z } from "zod";

const difficultyEnum = z.enum(["beginner", "intermediate", "advanced"]);

export const createGymBody = z.object({
  name: z.string().min(1, "Le nom est requis"),
  address: z.string().min(1, "L'adresse est requise"),
  capacity: z.number().int().min(1, "La capacité doit être au moins 1"),
  equipment: z.array(z.string()).optional().default([]),
  facilities: z.array(z.string()).optional().default([]),
  owner: z.string().min(1, "L'ID du propriétaire est requis"),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email invalide").optional(),
  exerciseTypes: z.array(
    z.string().regex(/^[0-9a-fA-F]{24}$/, "ID d'exercice invalide (doit être un ObjectId MongoDB)")
  ).optional().default([]),
  difficultyLevels: z.array(difficultyEnum).optional().default([])
});

export const updateGymBody = createGymBody
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Au moins un champ est requis",
  });

export const approveGymBody = z.object({
  approved: z.boolean(),
});

export const exerciseTypesBody = z.object({
  exerciseTypes: z.array(z.string()),
});

export const difficultyLevelsBody = z.object({
  difficultyLevels: z.array(difficultyEnum),
});

export type CreateGymInput = z.infer<typeof createGymBody>;
export type UpdateGymInput = z.infer<typeof updateGymBody>;
export type ExerciseTypesInput = z.infer<typeof exerciseTypesBody>;
export type DifficultyLevelsInput = z.infer<typeof difficultyLevelsBody>;
