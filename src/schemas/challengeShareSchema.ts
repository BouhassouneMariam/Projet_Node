import { z } from "zod";

export const shareChallengeBody = z.object({
    sharedWith: z.union([
        z.string().regex(/^[0-9a-fA-F]{24}$/, "ID utilisateur invalide"),
        z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "ID utilisateur invalide")).min(1, "Au moins un destinataire requis")
    ]),
    message: z.string().max(500, "Message trop long (max 500 caractères)").optional()
});

export const markShareSeenBody = z.object({
    seen: z.boolean()
});

export type ShareChallengeInput = z.infer<typeof shareChallengeBody>;
export type MarkShareSeenInput = z.infer<typeof markShareSeenBody>;