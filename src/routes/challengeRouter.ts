import { Router } from "express";
import { Types } from "mongoose";
import { validateMiddleware, authMiddleware } from "../middlewares";
import { createChallengeBody, CreateChallengeInput, updateChallengeBody, joinChallengeBody } from "../schemas";
import { ChallengeModel, GymModel, ExerciseTypeModel, UserModel } from "../models";

const challengeRouter = Router();

// ✅ GET ALL - Public
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

// ✅ FILTER - Public
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

// ✅ CREATE - Authentifié (avec vérification du propriétaire de la salle)
challengeRouter.post('/create', authMiddleware, validateMiddleware({ body: createChallengeBody }), async (req, res): Promise<void> => {
    try {
        const input = req.body as CreateChallengeInput;

        if (!req.user) {
            res.status(401).json({ error: "Utilisateur non authentifié" });
            return;
        }

        // Vérifier que l'exercice existe
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
            
            // Récupérer l'utilisateur connecté pour vérifier son rôle
            const currentUser = await UserModel.findById(req.user.id).exec();
            if (!currentUser) {
                res.status(401).json({ error: "Utilisateur non authentifié" });
                return;
            }
            
            const isOwner = gym.owner.toString() === req.user.id;
            const isAdmin = currentUser.role === 'admin';
            
            // Autoriser si propriétaire OU admin
            if (!isOwner && !isAdmin) {
                 res.status(403).json({ error: "Seul le propriétaire ou un admin peut créer un défi pour cette salle" });
                 return;
            }
        }

        const created = await ChallengeModel.create(input);
        res.status(201).json({ message: "Défi créé", challenge: created });
    } catch (error) {
        res.status(500).json({ error: "Erreur création défi" });
    }
});

// ✅ GET BY ID - Public
challengeRouter.get('/:id', async (req, res): Promise<void> => {
    try {
        const challenge = await ChallengeModel.findById(req.params.id)
            .populate('creator', 'firstname lastname')
            .populate('gym', 'name')
            .populate('exerciseType', 'name')
            .exec();
        if (!challenge) { 
            res.status(404).json({ error: "Défi non trouvé" }); 
            return; 
        }
        res.status(200).json(challenge);
    } catch (error) { 
        res.status(500).json({ error: "Erreur récupération" }); 
    }
});

// ✅ JOIN - Authentifié
challengeRouter.post('/:id/join', authMiddleware, validateMiddleware({ body: joinChallengeBody }), async (req, res): Promise<void> => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        const challenge = await ChallengeModel.findById(id).exec();
        
        if (!challenge) { 
            res.status(404).json({ error: "Défi non trouvé" }); 
            return; 
        }
        
        // Vérifier la limite de participants
        if (challenge.maxParticipants && challenge.participants.length >= challenge.maxParticipants) {
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
    } catch (error) { 
        res.status(500).json({ error: "Erreur join" }); 
    }
});

// ✅ UPDATE - Créateur du défi OU admin
challengeRouter.patch('/update/:id', authMiddleware, validateMiddleware({ body: updateChallengeBody }), async (req, res): Promise<void> => {
    try {
        const { id } = req.params;
        
        const challenge = await ChallengeModel.findById(id).exec();
        if (!challenge) {
            res.status(404).json({ error: "Défi non trouvé" });
            return;
        }
        
        // Vérifier que l'utilisateur est le créateur ou admin
        const currentUser = await UserModel.findById(req.user?.id).exec();
        if (!currentUser) {
            res.status(401).json({ error: "Utilisateur non authentifié" });
            return;
        }
        
        const isCreator = challenge.creator.toString() === req.user?.id;
        const isAdmin = currentUser.role === 'admin';
        
        if (!isCreator && !isAdmin) {
            res.status(403).json({ error: "Seul le créateur ou un admin peut modifier ce défi" });
            return;
        }
        
        const updated = await ChallengeModel.findByIdAndUpdate(id, req.body, { new: true }).exec();
        res.json(updated);
    } catch (error) { 
        res.status(500).json({ error: "Erreur update" }); 
    }
});

// ✅ DELETE - Créateur du défi OU admin
challengeRouter.delete('/:id', authMiddleware, async (req, res): Promise<void> => {
    try {
        const { id } = req.params;
        
        const challenge = await ChallengeModel.findById(id).exec();
        if (!challenge) {
            res.status(404).json({ error: "Défi non trouvé" });
            return;
        }
        
        // Vérifier que l'utilisateur est le créateur ou admin
        const currentUser = await UserModel.findById(req.user?.id).exec();
        if (!currentUser) {
            res.status(401).json({ error: "Utilisateur non authentifié" });
            return;
        }
        
        const isCreator = challenge.creator.toString() === req.user?.id;
        const isAdmin = currentUser.role === 'admin';
        
        if (!isCreator && !isAdmin) {
            res.status(403).json({ error: "Seul le créateur ou un admin peut supprimer ce défi" });
            return;
        }
        
        await ChallengeModel.findByIdAndDelete(id).exec();
        res.status(204).send();
    } catch (error) { 
        res.status(500).json({ error: "Erreur delete" }); 
    }
});

export { challengeRouter };