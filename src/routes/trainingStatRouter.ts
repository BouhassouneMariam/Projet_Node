import { Router } from "express";
import { authMiddleware, validateMiddleware, roleMiddleware } from "../middlewares";
import { createTrainingStatBody, CreateTrainingStatInput, updateTrainingStatBody, UpdateTrainingStatInput } from "../schemas";
import { TrainingStatModel, ScoreModel, UserModel } from "../models";
import { BadgeService } from "../utils/badgeService";

const trainingStatRouter = Router();

trainingStatRouter.post('/create', authMiddleware, validateMiddleware({ body: createTrainingStatBody }), async (req, res): Promise<void> => {
    try {
        const input = req.body as CreateTrainingStatInput;
        
        // Récupérer l'utilisateur connecté
        const currentUser = await UserModel.findById(req.user?.id).exec();
        if (!currentUser) {
            res.status(401).json({ error: "Utilisateur non authentifié" });
            return;
        }
        
        const isAdmin = currentUser.role === 'admin';
        
        // Vérifier que l'utilisateur crée ses propres stats (sauf si admin)
        if (input.user !== req.user?.id && !isAdmin) {
            res.status(403).json({ error: "Vous ne pouvez créer des stats que pour vous-même" });
            return;
        }
        
        const created = await TrainingStatModel.create(input);

        if (created.completed) {
            const points = input.duration * 10; 
            
            await ScoreModel.findOneAndUpdate(
                { user: input.user },
                { 
                    $inc: { totalPoints: points, challengesCompleted: 1 }, 
                    $setOnInsert: { user: input.user } 
                },
                { upsert: true, new: true }
            );
            
            await BadgeService.checkAndAwardAllBadges(input.user);
        }
        res.status(201).json({ message: "Séance enregistrée", trainingStat: created });
    } catch(error) { 
        res.status(500).json({ error: "Erreur enregistrement" }); 
    }
});

trainingStatRouter.get('/user/:userId', authMiddleware, async (req, res): Promise<void> => {
    try {
        const { userId } = req.params;
        
        // Récupérer l'utilisateur connecté
        const currentUser = await UserModel.findById(req.user?.id).exec();
        if (!currentUser) {
            res.status(401).json({ error: "Utilisateur non authentifié" });
            return;
        }
        
        const isAdmin = currentUser.role === 'admin';
        
        // Vérifier que l'utilisateur consulte ses propres stats (sauf si admin)
        if (userId !== req.user?.id && !isAdmin) {
            res.status(403).json({ error: "Vous ne pouvez voir que vos propres statistiques" });
            return;
        }
        
        const history = await TrainingStatModel.find({ user: userId })
            .populate('challenge', 'title description difficulty')
            .sort({ sessionDate: -1 }); 
        res.json(history);
    } catch(error) { 
        res.status(500).json({ error: "Erreur récupération" }); 
    }
});

trainingStatRouter.patch('/update/:id', authMiddleware, validateMiddleware({ body: updateTrainingStatBody }), async (req, res): Promise<void> => {
    try {
        const { id } = req.params;
        
        const stat = await TrainingStatModel.findById(id).exec();
        if (!stat) {
            res.status(404).json({ error: "Statistique introuvable" });
            return;
        }
        
        // Récupérer l'utilisateur connecté
        const currentUser = await UserModel.findById(req.user?.id).exec();
        if (!currentUser) {
            res.status(401).json({ error: "Utilisateur non authentifié" });
            return;
        }
        
        const isOwner = stat.user.toString() === req.user?.id;
        const isAdmin = currentUser.role === 'admin';
        
        // Vérifier que l'utilisateur modifie ses propres stats (sauf si admin)
        if (!isOwner && !isAdmin) {
            res.status(403).json({ error: "Vous ne pouvez modifier que vos propres statistiques" });
            return;
        }
        
        const updates = req.body as UpdateTrainingStatInput;
        const updated = await TrainingStatModel.findByIdAndUpdate(id, updates, { new: true });
        if (!updated) {
            res.status(404).json({ error: "Statistique introuvable" });
            return;
        }
        res.json(updated);
    } catch(error) { 
        res.status(500).json({ error: "Erreur mise à jour" }); 
    }
});

trainingStatRouter.delete('/:id', authMiddleware, roleMiddleware(["admin"]), async (req, res): Promise<void> => {
    try {
        const { id } = req.params;
        
        const stat = await TrainingStatModel.findById(id).exec();
        if (!stat) {
            res.status(404).json({ error: "Statistique introuvable" });
            return;
        }
        
        // Récupérer l'utilisateur connecté
        const currentUser = await UserModel.findById(req.user?.id).exec();
        if (!currentUser) {
            res.status(401).json({ error: "Utilisateur non authentifié" });
            return;
        }
        
        const isOwner = stat.user.toString() === req.user?.id;
        const isAdmin = currentUser.role === 'admin';
        
        // Vérifier que l'utilisateur supprime ses propres stats (sauf si admin)
        if (!isOwner && !isAdmin) {
            res.status(403).json({ error: "Vous ne pouvez supprimer que vos propres statistiques" });
            return;
        }
        
        await TrainingStatModel.findByIdAndDelete(id);
        res.status(204).send();
    } catch(error) { 
        res.status(500).json({ error: "Erreur suppression" }); 
    }
});

export { trainingStatRouter };