import { z } from "zod";

export const createChallengeBody = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().min(1, "La description est requise"),
  creator: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID créateur invalide (doit être un ObjectId valide)"),
  exerciseType: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID type d'exercice invalide (doit être un ObjectId valide)"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  duration: z.number().int().min(1, "La durée doit être au moins 1 jour"),
  objectives: z.string().min(1, "Les objectifs sont requis"),
  gym: z.string().optional(),
  maxParticipants: z.number().int().positive().optional(),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
}).refine((data) => {
    if (data.startDate && data.endDate) {
        return new Date(data.startDate) < new Date(data.endDate);
    }
    return true;
}, {
    message: "La date de fin doit être postérieure à la date de début",
    path: ["endDate"],
});

export const updateChallengeBody = createChallengeBody
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Au moins un champ est requis",
  });

export const joinChallengeBody = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID utilisateur invalide (doit être un ObjectId valide)"),
});

export const completeChallengeBody = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID utilisateur invalide (doit être un ObjectId valide)"),
});

export type CreateChallengeInput = z.infer<typeof createChallengeBody>;
export type UpdateChallengeInput = z.infer<typeof updateChallengeBody>;
export type JoinChallengeInput = z.infer<typeof joinChallengeBody>;
export type CompleteChallengeInput = z.infer<typeof completeChallengeBody>;