import { Router } from "express";
import { Types } from "mongoose";
import { validateMiddleware, authMiddleware } from "../middlewares";
import { createChallengeBody, CreateChallengeInput, updateChallengeBody, joinChallengeBody } from "../schemas";
// ✅ AJOUT DE ExerciseTypeModel DANS L'IMPORT
import { ChallengeModel, GymModel, ExerciseTypeModel } from "../models";

const challengeRouter = Router();

// 1. Route GET ALL
challengeRouter.get('/getAll', async (req, res): Promise<void> => {
    try {
        const challenges = await ChallengeModel.find()
            .populate('creator', 'firstname lastname email')
            .populate('exerciseType', 'name difficulty')
            .populate('gym', 'name')
            .sort({ createdAt: -1 })
            .exec();
        res.status(200).json(challenges);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération des défis" });
    }
});

// 2. Route FILTER
challengeRouter.get('/filter', async (req, res): Promise<void> => {
    try {
        const { difficulty, exerciseType, duration, gymId } = req.query;
        const filter: any = {};

        if (difficulty) filter.difficulty = difficulty;
        if (exerciseType) filter.exerciseType = exerciseType;
        if (duration) filter.duration = { $lte: parseInt(duration as string) };
        if (gymId) filter.gym = gymId;

        const challenges = await ChallengeModel.find(filter)
            .populate('creator', 'firstname lastname email')
            .populate('exerciseType', 'name difficulty')
            .populate('gym', 'name')
            .exec();
            
        res.status(200).json(challenges);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors du filtrage des défis" });
    }
});

// 3. Route CREATE (Modifiée pour vérifier ExerciseType)
challengeRouter.post('/create', authMiddleware, validateMiddleware({ body: createChallengeBody }), async (req, res): Promise<void> => {
    try {
        const input = req.body as CreateChallengeInput;

        if (!req.user) {
            res.status(401).json({ error: "Utilisateur non authentifié" });
            return;
        }

        // ✅ VÉRIFICATION 1 : L'EXERCICE EXISTE-T-IL ?
        const exerciseExists = await ExerciseTypeModel.findById(input.exerciseType);
        if (!exerciseExists) {
            res.status(404).json({ error: "Ce type d'exercice n'existe pas" });
            return;
        }

        if (input.gym) {
            const gym = await GymModel.findById(input.gym).exec();
            if (!gym) {
                res.status(404).json({ error: "Salle non trouvée" });
                return;
            }
            
            if (gym.owner.toString() !== req.user.id) {
                 res.status(403).json({ error: "Seul le propriétaire peut créer un défi pour cette salle" });
                 return;
            }
        }

        const created = await ChallengeModel.create(input);
        res.status(201).json({ message: "Défi créé", challenge: created });
    } catch (error) {
        res.status(500).json({ error: "Erreur création défi" });
    }
});

// 4. Route GET BY ID
challengeRouter.get('/:id', async (req, res): Promise<void> => {
    try {
        const challenge = await ChallengeModel.findById(req.params.id)
            .populate('creator', 'firstname lastname')
            .populate('gym', 'name')
            .populate('exerciseType', 'name')
            .exec();
        if (!challenge) { res.status(404).json({ error: "Défi non trouvé" }); return; }
        res.status(200).json(challenge);
    } catch (error) { res.status(500).json({ error: "Erreur récupération" }); }
});

// 5. Route JOIN (Modifiée pour vérifier la limite)
challengeRouter.post('/:id/join', authMiddleware, validateMiddleware({ body: joinChallengeBody }), async (req, res): Promise<void> => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        const challenge = await ChallengeModel.findById(id).exec();
        
        if (!challenge) { res.status(404).json({ error: "Défi non trouvé" }); return; }
        
        // ✅ VÉRIFICATION 2 : LIMITE PARTICIPANTS ATTEINTE ?
        if (challenge.maxParticipants && challenge.participants.length >= challenge.maxParticipants) {
            // On vérifie si l'user est déjà dedans avant de bloquer
            const alreadyIn = challenge.participants.some(p => p.toString() === userId);
            if (!alreadyIn) {
                res.status(400).json({ error: "Le défi est complet (nombre max de participants atteint)" });
                return;
            }
        }

        if (!challenge.participants.some(p => p.toString() === userId)) {
            challenge.participants.push(new Types.ObjectId(userId));
            await challenge.save();
        }
        res.status(200).json({ message: "Rejoint avec succès" });
    } catch (error) { res.status(500).json({ error: "Erreur join" }); }
});

// 6. Route UPDATE
challengeRouter.patch('/update/:id', authMiddleware, validateMiddleware({ body: updateChallengeBody }), async (req, res): Promise<void> => {
    try {
        const updated = await ChallengeModel.findByIdAndUpdate(req.params.id, req.body, { new: true }).exec();
        if (!updated) { res.status(404).json({ error: "Défi non trouvé" }); return; }
        res.json(updated);
    } catch (error) { res.status(500).json({ error: "Erreur update" }); }
});

// 7. Route DELETE
challengeRouter.delete('/:id', authMiddleware, async (req, res): Promise<void> => {
    try {
        const deleted = await ChallengeModel.findByIdAndDelete(req.params.id).exec();
        if (!deleted) { res.status(404).json({ error: "Défi non trouvé" }); return; }
        res.status(204).send();
    } catch (error) { res.status(500).json({ error: "Erreur delete" }); }
});

export { challengeRouter };