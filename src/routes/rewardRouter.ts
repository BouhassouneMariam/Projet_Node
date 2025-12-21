import { Router } from "express";
import { authMiddleware, validateMiddleware, roleMiddleware } from "../middlewares";
import { createRewardBody, CreateRewardInput, updateRewardBody, UpdateRewardInput, awardRewardBody, AwardRewardInput } from "../schemas";
import { RewardModel, UserRewardModel } from "../models";
import { RewardService } from "../utils/rewardService";

const rewardRouter = Router();


rewardRouter.get('/getAll', authMiddleware, roleMiddleware(["admin"]), async (req, res): Promise<void> => {
    try {
        const rewards = await RewardModel.find().sort({ created_at: -1 }).exec();
        res.status(200).json(rewards);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération des récompenses" });
    }
});

rewardRouter.get('/active', async (req, res): Promise<void> => {
    try {
        const rewards = await RewardModel.find({ isActive: true }).exec();
        res.status(200).json(rewards);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération des récompenses" });
    }
});


rewardRouter.get('/get/:id', authMiddleware, async (req, res): Promise<void> => {
    try {
        const reward = await RewardModel.findById(req.params.id).exec();
        if (!reward) {
            res.status(404).json({ error: "Récompense non trouvée" });
            return;
        }
        res.status(200).json(reward);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération de la récompense" });
    }
});


rewardRouter.post('/create', authMiddleware, roleMiddleware(["admin"]), validateMiddleware({ body: createRewardBody }), async (req, res): Promise<void> => {
    try {
        const input = req.body as CreateRewardInput;
        const created = await RewardModel.create(input);
        res.status(201).json({ message: "Récompense créée", reward: created });
    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
            res.status(400).json({ error: "Une récompense avec ce nom existe déjà" });
            return;
        }
        res.status(500).json({ error: "Erreur lors de la création de la récompense" });
    }
});


rewardRouter.patch('/update/:id', authMiddleware, roleMiddleware(["admin"]), validateMiddleware({ body: updateRewardBody }), async (req, res): Promise<void> => {
    try {
        const updates = req.body as UpdateRewardInput;
        const updated = await RewardModel.findByIdAndUpdate(req.params.id, updates, { new: true }).exec();
        if (!updated) {
            res.status(404).json({ error: "Récompense non trouvée" });
            return;
        }
        res.status(200).json({ message: "Récompense mise à jour", reward: updated });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la mise à jour de la récompense" });
    }
});


rewardRouter.patch('/toggle/:id', authMiddleware, roleMiddleware(["admin"]), async (req, res): Promise<void> => {
    try {
        const reward = await RewardModel.findById(req.params.id).exec();
        if (!reward) {
            res.status(404).json({ error: "Récompense non trouvée" });
            return;
        }
        reward.isActive = !reward.isActive;
        await reward.save();
        res.status(200).json({ 
            message: reward.isActive ? "Récompense activée" : "Récompense désactivée", 
            reward 
        });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors du changement de statut" });
    }
});


rewardRouter.delete('/delete/:id', authMiddleware, roleMiddleware(["admin"]), async (req, res): Promise<void> => {
    try {
        const deleted = await RewardModel.findByIdAndDelete(req.params.id).exec();
        if (!deleted) {
            res.status(404).json({ error: "Récompense non trouvée" });
            return;
        }
      
        await UserRewardModel.deleteMany({ reward: req.params.id });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la suppression de la récompense" });
    }
});


rewardRouter.delete('/deleteAll', authMiddleware, roleMiddleware(["admin"]), async (req, res): Promise<void> => {
    try {
        await RewardModel.deleteMany({});
        await UserRewardModel.deleteMany({});
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la suppression des récompenses" });
    }
});


rewardRouter.post('/:id/award', authMiddleware, roleMiddleware(["admin"]), validateMiddleware({ body: awardRewardBody }), async (req, res): Promise<void> => {
    try {
        const rewardId = req.params.id;
        const { userId } = req.body as AwardRewardInput;

        if (!rewardId) {
            res.status(400).json({ error: "ID de récompense requis" });
            return;
        }

        const result = await RewardService.awardManually(userId, rewardId);
        
        if (result.success) {
            res.status(201).json({ message: result.message });
        } else {
            res.status(400).json({ error: result.message });
        }
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de l'attribution de la récompense" });
    }
});


rewardRouter.get('/my', authMiddleware, async (req, res): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Utilisateur non authentifié" });
            return;
        }

        const userRewards = await RewardService.getUserRewards(req.user.id);
        res.status(200).json(userRewards);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération de vos récompenses" });
    }
});


rewardRouter.get('/user/:userId', authMiddleware, async (req, res): Promise<void> => {
    try {
        const userId = req.params.userId;
        
        if (!userId) {
            res.status(400).json({ error: "ID utilisateur requis" });
            return;
        }

        const userRewards = await RewardService.getUserRewards(userId);
        res.status(200).json(userRewards);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération des récompenses" });
    }
});

export { rewardRouter };