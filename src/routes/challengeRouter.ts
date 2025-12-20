import { Router } from "express";
import { Types } from "mongoose";
import { validateMiddleware, authMiddleware } from "../middlewares";
import { createChallengeBody, CreateChallengeInput, updateChallengeBody, joinChallengeBody, completeChallengeBody } from "../schemas";
import { ChallengeModel, GymModel, SocialChallengeModel } from "../models";
import { addPointsForChallenge } from "../utils/scoreService";

const challengeRouter = Router();


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


challengeRouter.get('/my/created', authMiddleware, async (req, res): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Non authentifié" });
            return;
        }

        const challenges = await ChallengeModel.find({ creator: req.user.id })
            .populate('exerciseType', 'name difficulty')
            .populate('gym', 'name')
            .populate('participants', 'firstname lastname email')
            .sort({ created_at: -1 })
            .exec();

        res.status(200).json({
            count: challenges.length,
            challenges
        });
    } catch (error) {
        res.status(500).json({ error: "Erreur récupération défis créés" });
    }
});

challengeRouter.get('/my/participating', authMiddleware, async (req, res): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Non authentifié" });
            return;
        }

        const challenges = await ChallengeModel.find({
            participants: req.user.id,
            creator: { $ne: req.user.id }
        })
            .populate('creator', 'firstname lastname')
            .populate('exerciseType', 'name difficulty')
            .populate('gym', 'name')
            .sort({ created_at: -1 })
            .exec();

        res.status(200).json({
            count: challenges.length,
            challenges
        });
    } catch (error) {
        res.status(500).json({ error: "Erreur récupération participations" });
    }
});

challengeRouter.get('/my/all', authMiddleware, async (req, res): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Non authentifié" });
            return;
        }

        const challenges = await ChallengeModel.find({
            $or: [
                { creator: req.user.id },
                { participants: req.user.id }
            ]
        })
            .populate('creator', 'firstname lastname')
            .populate('exerciseType', 'name difficulty')
            .populate('gym', 'name')
            .sort({ created_at: -1 })
            .exec();

        const created = challenges.filter(c => c.creator._id.toString() === req.user!.id);
        const participating = challenges.filter(c => c.creator._id.toString() !== req.user!.id);

        res.status(200).json({
            summary: {
                totalCreated: created.length,
                totalParticipating: participating.length,
                total: challenges.length
            },
            created,
            participating
        });
    } catch (error) {
        res.status(500).json({ error: "Erreur récupération défis" });
    }
});

challengeRouter.get('/my/active', authMiddleware, async (req, res): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Non authentifié" });
            return;
        }

        const now = new Date();

        const challenges = await ChallengeModel.find({
            $and: [
                {
                    $or: [
                        { creator: req.user.id },
                        { participants: req.user.id }
                    ]
                },
                {
                    $or: [
                        { endDate: { $gte: now } },
                        { endDate: { $exists: false } },
                        { endDate: null }
                    ]
                }
            ]
        })
            .populate('creator', 'firstname lastname')
            .populate('exerciseType', 'name difficulty')
            .populate('gym', 'name')
            .sort({ endDate: 1 })
            .exec();

        res.status(200).json({
            count: challenges.length,
            challenges
        });
    } catch (error) {
        res.status(500).json({ error: "Erreur récupération défis actifs" });
    }
});

challengeRouter.get('/my/completed', authMiddleware, async (req, res): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Non authentifié" });
            return;
        }

        const now = new Date();

        const challenges = await ChallengeModel.find({
            $and: [
                {
                    $or: [
                        { creator: req.user.id },
                        { participants: req.user.id }
                    ]
                },
                { endDate: { $lt: now } }
            ]
        })
            .populate('creator', 'firstname lastname')
            .populate('exerciseType', 'name difficulty')
            .populate('gym', 'name')
            .sort({ endDate: -1 })
            .exec();

        res.status(200).json({
            count: challenges.length,
            challenges
        });
    } catch (error) {
        res.status(500).json({ error: "Erreur récupération défis terminés" });
    }
});

challengeRouter.get('/my/social', authMiddleware, async (req, res): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Non authentifié" });
            return;
        }

        const socialChallenges = await SocialChallengeModel.find({
            $or: [
                { inviter: req.user.id },
                { invitee: req.user.id }
            ]
        })
            .populate({
                path: 'challenge',
                populate: [
                    { path: 'exerciseType', select: 'name difficulty' },
                    { path: 'gym', select: 'name' }
                ]
            })
            .populate('inviter', 'firstname lastname email')
            .populate('invitee', 'firstname lastname email')
            .sort({ createdAt: -1 })
            .exec();

        const pending = socialChallenges.filter(sc => sc.status === 'pending');
        const accepted = socialChallenges.filter(sc => sc.status === 'accepted');
        const completed = socialChallenges.filter(sc => sc.status === 'completed');
        const declined = socialChallenges.filter(sc => sc.status === 'declined');

        res.status(200).json({
            summary: {
                pending: pending.length,
                accepted: accepted.length,
                completed: completed.length,
                declined: declined.length,
                total: socialChallenges.length
            },
            pending,
            accepted,
            completed,
            declined
        });
    } catch (error) {
        res.status(500).json({ error: "Erreur récupération défis sociaux" });
    }
});


challengeRouter.post('/create', authMiddleware, validateMiddleware({ body: createChallengeBody }), async (req, res): Promise<void> => {
    try {
        const input = req.body as CreateChallengeInput;

        if (!req.user) {
            res.status(401).json({ error: "Utilisateur non authentifié" });
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

challengeRouter.patch('/update/:id', authMiddleware, validateMiddleware({ body: updateChallengeBody }), async (req, res): Promise<void> => {
    try {
        const updated = await ChallengeModel.findByIdAndUpdate(req.params.id, req.body, { new: true }).exec();
        if (!updated) {
            res.status(404).json({ error: "Défi non trouvé" });
            return;
        }
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: "Erreur update" });
    }
});

challengeRouter.get('/:id', async (req, res): Promise<void> => {
    try {
        const challenge = await ChallengeModel.findById(req.params.id)
            .populate('creator', 'firstname lastname')
            .populate('gym', 'name')
            .populate('exerciseType', 'name difficulty')
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

challengeRouter.post('/:id/join', authMiddleware, validateMiddleware({ body: joinChallengeBody }), async (req, res): Promise<void> => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        const challenge = await ChallengeModel.findById(id).exec();
        if (!challenge) {
            res.status(404).json({ error: "Défi non trouvé" });
            return;
        }

        if (!challenge.participants.some(p => p.toString() === userId)) {
            challenge.participants.push(userId);
            await challenge.save();
        }
        res.status(200).json({ message: "Rejoint avec succès" });
    } catch (error) {
        res.status(500).json({ error: "Erreur join" });
    }
});

challengeRouter.post('/:id/complete', authMiddleware, validateMiddleware({ body: completeChallengeBody }), async (req, res): Promise<void> => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        if (id && !Types.ObjectId.isValid(id)) {
            res.status(400).json({ error: "ID de défi invalide" });
            return;
        }

        const challenge = await ChallengeModel.findById(id).exec();

        if (!challenge) {
            res.status(404).json({ error: "Défi non trouvé" });
            return;
        }

        const isParticipant = challenge.participants.some(p => p.toString() === userId);
        if (!isParticipant && challenge.creator.toString() !== userId) {
            res.status(403).json({ error: "Vous ne participez pas à ce défi" });
            return;
        }

        await addPointsForChallenge(userId, challenge.difficulty, false);

        res.status(200).json({
            message: "Défi complété avec succès",
            pointsEarned: challenge.difficulty === 'beginner' ? 10 : challenge.difficulty === 'intermediate' ? 20 : 30
        });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la complétion du défi" });
    }
});

challengeRouter.delete('/:id', authMiddleware, async (req, res): Promise<void> => {
    try {
        const deleted = await ChallengeModel.findByIdAndDelete(req.params.id).exec();
        if (!deleted) {
            res.status(404).json({ error: "Défi non trouvé" });
            return;
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: "Erreur delete" });
    }
});

export { challengeRouter };