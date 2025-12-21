import { z } from "zod";

export const createScoreBody = z.object({
    user: z.string().min(1, "L'ID utilisateur est requis"),
});

export const updateScoreBody = z.object({
    totalPoints: z.number().optional(),
});

export const addPointsBody = z.object({
    userId: z.string().min(1, "L'ID utilisateur est requis"),
    points: z.number().int("Les points doivent être un nombre entier").min(1, "Les points doivent être au moins 1"),
});

export type CreateScoreInput = z.infer<typeof createScoreBody>;
export type UpdateScoreInput = z.infer<typeof updateScoreBody>;
export type AddPointsInput = z.infer<typeof addPointsBody>;