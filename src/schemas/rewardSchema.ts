import { z } from "zod";

export const createRewardBody = z.object({
    name: z.string().min(1, "Le nom est requis"),
    description: z.string().min(1, "La description est requise"),
    type: z.enum(["trophy", "medal", "item", "title"], {
        message: "Type invalide"
    }),
    iconUrl: z.string().min(1, "L'URL de l'icône est requise"),
    rarity: z.enum(["common", "rare", "epic", "legendary"]).default("common"),
    conditionType: z.enum(["challengeComplete", "socialComplete", "pointsThreshold", "manual"], {
        message: "Type de condition invalide"
    }),
    conditionValue: z.number().int().min(0).optional(),
    conditionDifficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    isActive: z.boolean().default(true)
});

export const updateRewardBody = createRewardBody
    .partial()
    .refine(obj => Object.keys(obj).length > 0, { message: "Au moins un champ est requis" });

export const awardRewardBody = z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID utilisateur invalide"),
    reason: z.string().optional()
});

export type CreateRewardInput = z.infer<typeof createRewardBody>;
export type UpdateRewardInput = z.infer<typeof updateRewardBody>;
export type AwardRewardInput = z.infer<typeof awardRewardBody>;