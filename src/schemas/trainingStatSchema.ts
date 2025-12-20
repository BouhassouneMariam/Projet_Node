import { z } from "zod";

const exerciseEntrySchema = z.object({
    exerciseType: z.string().min(1, "L'ID du type d'exercice est requis"),
    sets: z.number().int().min(1, "Au moins 1 série"),
    reps: z.number().int().min(0, "Le nombre de répétitions ne peut pas être négatif"),
    weight: z.number().min(0).optional(),
    distance: z.number().min(0).optional(),
    duration: z.number().min(0).optional(),
    notes: z.string().optional()
});

export const createTrainingStatBody = z.object({
    user: z.string().min(1, "L'ID utilisateur est requis"),
    challenge: z.string().min(1, "L'ID du défi est requis"),
    sessionDate: z.string().datetime(),
    duration: z.number().int().min(1, "La durée doit être au moins 1 minute"),
    caloriesBurned: z.number().min(0, "Les calories ne peuvent pas être négatives"),
    notes: z.string().optional(),
    completed: z.boolean().optional().default(false),
    exercises: z.array(exerciseEntrySchema).optional().default([])
});

export const updateTrainingStatBody = createTrainingStatBody
    .partial()
    .refine((obj) => Object.keys(obj).length > 0, {
        message: "Au moins un champ est requis",
    });

export type CreateTrainingStatInput = z.infer<typeof createTrainingStatBody>;
export type UpdateTrainingStatInput = z.infer<typeof updateTrainingStatBody>;
export type ExerciseEntryInput = z.infer<typeof exerciseEntrySchema>;