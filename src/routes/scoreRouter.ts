import { Router } from "express";
import { ScoreModel } from "../models";
import { authMiddleware, validateMiddleware } from "../middlewares";
import { addPointsForChallenge } from "../utils/scoreService";
import { addPointsBody } from "../schemas/scoreSchema";

const scoreRouter = Router();

scoreRouter.get('/leaderboard', async (req, res): Promise<void> => {
    try {
        const top = await ScoreModel.find()
            .sort({ totalPoints: -1 }) 
            .limit(10)
            .populate('user', 'firstname lastname email');
        res.json(top);
    } catch (error) { 
        res.status(500).json({ error: "Erreur leaderboard" }); 
    }
});

scoreRouter.get('/leaderboard/activity', async (req, res): Promise<void> => {
    try {
        const top = await ScoreModel.find()
            .sort({ totalTrainingSessions: -1 })
            .limit(10)
            .populate('user', 'firstname lastname email');
        res.json(top);
    } catch (error) {
        res.status(500).json({ error: "Erreur leaderboard activité" });
    }
});

scoreRouter.get('/leaderboard/streak', async (req, res): Promise<void> => {
    try {
        const top = await ScoreModel.find()
            .sort({ currentStreak: -1, longestStreak: -1 })
            .limit(10)
            .populate('user', 'firstname lastname email');
        res.json(top);
    } catch (error) {
        res.status(500).json({ error: "Erreur leaderboard streak" });
    }
});

scoreRouter.get('/leaderboard/time', async (req, res): Promise<void> => {
    try {
        const top = await ScoreModel.find()
            .sort({ totalTrainingMinutes: -1 })
            .limit(10)
            .populate('user', 'firstname lastname email');
        
        
        const formatted = top.map(score => ({
            ...score.toObject(),
            formattedTime: `${Math.floor(score.totalTrainingMinutes / 60)}h ${score.totalTrainingMinutes % 60}min`
        }));
        
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: "Erreur leaderboard temps" });
    }
});

scoreRouter.get('/leaderboard/combined', async (req, res): Promise<void> => {
    try {
        const scores = await ScoreModel.find()
            .populate('user', 'firstname lastname email');
        
        
        const ranked = scores.map(score => {
            const activityScore = 
                (score.totalPoints * 1) +
                (score.totalTrainingSessions * 50) +
                (score.currentStreak * 100) +
                (score.totalTrainingMinutes * 2) +
                (score.socialChallengesCompleted * 75);
            
            return {
                ...score.toObject(),
                activityScore
            };
        }).sort((a, b) => b.activityScore - a.activityScore).slice(0, 10);
        
        res.json(ranked);
    } catch (error) {
        res.status(500).json({ error: "Erreur leaderboard combiné" });
    }
});


scoreRouter.get('/leaderboard/weight', async (req, res): Promise<void> => {
    try {
        const top = await ScoreModel.find()
            .sort({ totalWeightLifted: -1 })
            .limit(10)
            .populate('user', 'firstname lastname email');
        
        const formatted = top.map(score => ({
            ...score.toObject(),
            formattedWeight: score.totalWeightLifted >= 1000 
                ? `${(score.totalWeightLifted / 1000).toFixed(2)} tonnes`
                : `${score.totalWeightLifted} kg`
        }));
        
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: "Erreur leaderboard poids" });
    }
});


scoreRouter.get('/leaderboard/distance', async (req, res): Promise<void> => {
    try {
        const top = await ScoreModel.find()
            .sort({ totalDistanceCovered: -1 })
            .limit(10)
            .populate('user', 'firstname lastname email');
        
        const formatted = top.map(score => ({
            ...score.toObject(),
            formattedDistance: score.totalDistanceCovered >= 1000 
                ? `${(score.totalDistanceCovered / 1000).toFixed(2)} km`
                : `${score.totalDistanceCovered} m`
        }));
        
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: "Erreur leaderboard distance" });
    }
});


scoreRouter.get('/leaderboard/calories', async (req, res): Promise<void> => {
    try {
        const top = await ScoreModel.find()
            .sort({ totalCaloriesBurned: -1 })
            .limit(10)
            .populate('user', 'firstname lastname email');
        res.json(top);
    } catch (error) {
        res.status(500).json({ error: "Erreur leaderboard calories" });
    }
});

scoreRouter.get('/stats/global', async (req, res): Promise<void> => {
    try {
        const stats = await ScoreModel.aggregate([
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    totalPointsAllUsers: { $sum: "$totalPoints" },
                    totalChallengesCompleted: { $sum: "$challengesCompleted" },
                    totalTrainingSessions: { $sum: "$totalTrainingSessions" },
                    totalTrainingMinutes: { $sum: "$totalTrainingMinutes" },
                    averageStreak: { $avg: "$currentStreak" },
                    maxStreak: { $max: "$longestStreak" }
                }
            }
        ]);

        if (stats.length === 0) {
            res.json({
                totalUsers: 0,
                totalPointsAllUsers: 0,
                totalChallengesCompleted: 0,
                totalTrainingSessions: 0,
                totalTrainingHours: 0,
                averageStreak: 0,
                maxStreak: 0
            });
            return;
        }

        const result = stats[0];
        res.json({
            totalUsers: result.totalUsers,
            totalPointsAllUsers: result.totalPointsAllUsers,
            totalChallengesCompleted: result.totalChallengesCompleted,
            totalTrainingSessions: result.totalTrainingSessions,
            totalTrainingHours: Math.round(result.totalTrainingMinutes / 60),
            averageStreak: Math.round(result.averageStreak * 10) / 10,
            maxStreak: result.maxStreak
        });
    } catch (error) {
        res.status(500).json({ error: "Erreur statistiques globales" });
    }
});

scoreRouter.get('/user/:userId', async (req, res): Promise<void> => {
    try {
        const score = await ScoreModel.findOne({ user: req.params.userId });
        if (!score) {
            res.status(404).json({ error: "Score non trouvé" });
            return;
        }

        
        const rankByPoints = await ScoreModel.countDocuments({
            totalPoints: { $gt: score.totalPoints }
        }) + 1;

        const rankByActivity = await ScoreModel.countDocuments({
            totalTrainingSessions: { $gt: score.totalTrainingSessions }
        }) + 1;

        res.json({
            ...score.toObject(),
            rankings: {
                byPoints: rankByPoints,
                byActivity: rankByActivity
            },
            formattedTrainingTime: `${Math.floor(score.totalTrainingMinutes / 60)}h ${score.totalTrainingMinutes % 60}min`
        });
    } catch (error) {
        res.status(500).json({ error: "Erreur récupération score" });
    }
});

scoreRouter.post('/add-points', authMiddleware, validateMiddleware({ body: addPointsBody }), async (req, res): Promise<void> => {
    try {
        const { userId, points } = req.body;

        const score = await ScoreModel.findOne({ user: userId });
        
        if (score) {
            score.totalPoints += points;
            await score.save();
        } else {
            await ScoreModel.create({
                user: userId,
                totalPoints: points,
                challengesCompleted: 0,
                badgesEarned: 0,
                 totalTrainingSessions: 0,
                totalTrainingMinutes: 0,
                currentStreak: 0,
                longestStreak: 0,
                lastActivityDate: null,
                socialChallengesCompleted: 0
            });
        }

        res.status(200).json({ message: "Points ajoutés avec succès", points });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de l'ajout des points" });
    }
});

export { scoreRouter };