import { Router } from "express";
import { authMiddleware, validateMiddleware } from "../middlewares";
import { createSocialChallengeBody } from "../schemas/socialChallengeSchema";
import { SocialChallengeModel, UserModel } from "../models";

const socialRouter = Router();

// ✅ INVITE - Authentifié (doit être l'inviter)
socialRouter.post('/invite', authMiddleware, validateMiddleware({ body: createSocialChallengeBody }), async (req, res): Promise<void> => {
    try {
        const { inviter } = req.body;
        
        // Vérifier que l'utilisateur connecté est bien celui qui invite
        if (inviter !== req.user?.id) {
            res.status(403).json({ error: "Vous ne pouvez inviter qu'en votre propre nom" });
            return;
        }
        
        const created = await SocialChallengeModel.create(req.body);
        res.status(201).json(created);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de l'invitation" });
    }
});

// ✅ UPDATE STATUS - Authentifié (doit être l'invitee)
socialRouter.patch('/:id/status', authMiddleware, async (req, res): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const invitation = await SocialChallengeModel.findById(id).exec();
        if (!invitation) {
            res.status(404).json({ error: "Invitation non trouvée" });
            return;
        }
        
        // Vérifier que l'utilisateur connecté est bien l'invité OU admin
        const currentUser = await UserModel.findById(req.user?.id).exec();
        const isInvitee = invitation.invitee.toString() === req.user?.id;
        const isAdmin = currentUser?.role === 'admin';
        
        if (!isInvitee && !isAdmin) {
            res.status(403).json({ error: "Seul l'invité peut modifier le statut de cette invitation" });
            return;
        }
        
        const updated = await SocialChallengeModel.findByIdAndUpdate(id, { status }, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la mise à jour du statut" });
    }
});

// ✅ GET INVITATIONS - Authentifié (peut voir ses propres invitations OU admin voit tout)
socialRouter.get('/invitations/:userId', authMiddleware, async (req, res): Promise<void> => {
    try {
        const { userId } = req.params;
        
        // Vérifier que l'utilisateur consulte ses propres invitations (sauf si admin)
        const currentUser = await UserModel.findById(req.user?.id).exec();
        const isAdmin = currentUser?.role === 'admin';
        
        if (userId !== req.user?.id && !isAdmin) {
            res.status(403).json({ error: "Vous ne pouvez voir que vos propres invitations" });
            return;
        }
        
        const invites = await SocialChallengeModel.find({ invitee: userId, status: 'pending' })
            .populate('challenge', 'title')
            .populate('inviter', 'firstname lastname')
            .exec();
        res.json(invites);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération des invitations" });
    }
});

export { socialRouter };