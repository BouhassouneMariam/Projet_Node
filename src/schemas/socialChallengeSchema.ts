import { z } from "zod";

export const createSocialChallengeBody = z.object({
    challenge: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID du défi invalide (doit être un ObjectId valide)"),
    inviter: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID de l'inviteur invalide (doit être un ObjectId valide)"),
    invitee: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID de l'invité invalide (doit être un ObjectId valide)"),
});

export const updateSocialChallengeStatusBody = z.object({
    status: z.enum(["pending", "accepted", "declined", "completed"], {
        message: "Le statut doit être 'pending', 'accepted', 'declined' ou 'completed'"
    }),
});

export type CreateSocialChallengeInput = z.infer<typeof createSocialChallengeBody>;
export type UpdateSocialChallengeStatusInput = z.infer<typeof updateSocialChallengeStatusBody>;