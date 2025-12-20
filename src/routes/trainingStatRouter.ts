import { Router } from "express";
import { authMiddleware, validateMiddleware } from "../middlewares";
import {
  createTrainingStatBody,
  CreateTrainingStatInput,
  updateTrainingStatBody,
  UpdateTrainingStatInput,
} from "../schemas";
import { TrainingStatModel, ScoreModel } from "../models";
import { BadgeService } from "../utils/badgeService";
import { StreakService } from "../utils/streakService";

const trainingStatRouter = Router();

trainingStatRouter.post('/create', authMiddleware, validateMiddleware({ body: createTrainingStatBody }), async (req, res): Promise<void> => {
    try {
        const input = req.body as CreateTrainingStatInput;
        const created = await TrainingStatModel.create(input);

        if (created.completed) {
            const points = input.duration * 10;

            await ScoreModel.findOneAndUpdate(
                { user: input.user },
                {
                    $inc: {
                        totalPoints: points,
                        challengesCompleted: 1,
                        totalTrainingSessions: 1,
                        totalTrainingMinutes: input.duration,
                        totalWeightLifted: created.totalWeight || 0,
                        totalRepsCompleted: created.totalReps || 0,
                        totalDistanceCovered: created.totalDistance || 0,
                        totalCaloriesBurned: input.caloriesBurned
                    },
                    $setOnInsert: {
                        user: input.user,
                        badgesEarned: 0,
                        currentStreak: 0,
                        longestStreak: 0,
                        socialChallengesCompleted: 0
                    }
                },
                { upsert: true, new: true }
            );

            
            await StreakService.updateStreak(input.user);

         
            await BadgeService.checkAndAwardAllBadges(input.user);
        }

        res.status(201).json({ 
            message: "Séance enregistrée", 
            trainingStat: created,
            stats: {
                totalWeight: created.totalWeight,
                totalReps: created.totalReps,
                totalDistance: created.totalDistance,
                totalSets: created.totalSets
            }
        });
    } catch (error) {
        console.error("Erreur enregistrement:", error);
        res.status(500).json({ error: "Erreur enregistrement" });
    }
});

trainingStatRouter.get(
  "/user/:userId",
  authMiddleware,
  async (req, res): Promise<void> => {
    try {
      const history = await TrainingStatModel.find({ user: req.params.userId })
        .populate("challenge", "title description difficulty")
        .sort({ sessionDate: -1 });
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Erreur récupération" });
    }
  }
);

trainingStatRouter.get(
  "/user/:userId/summary",
  authMiddleware,
  async (req, res): Promise<void> => {
    try {
      const userId = req.params.userId;

      const stats = await TrainingStatModel.aggregate([
        { $match: { user: userId, completed: true } },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            totalDuration: { $sum: "$duration" },
            totalCalories: { $sum: "$caloriesBurned" },
            avgDuration: { $avg: "$duration" },
            avgCalories: { $avg: "$caloriesBurned" },
          },
        },
      ]);
      const monthlyStats = await TrainingStatModel.aggregate([
        { $match: { user: userId, completed: true } },
        {
          $group: {
            _id: {
              year: { $year: "$sessionDate" },
              month: { $month: "$sessionDate" },
            },
            sessions: { $sum: 1 },
            duration: { $sum: "$duration" },
            calories: { $sum: "$caloriesBurned" },
          },
        },
        { $sort: { "_id.year": -1, "_id.month": -1 } },
        { $limit: 12 },
      ]);

      res.json({
        overall: stats[0] || {
          totalSessions: 0,
          totalDuration: 0,
          totalCalories: 0,
          avgDuration: 0,
          avgCalories: 0,
        },
        monthly: monthlyStats,
      });
    } catch (error) {
      res.status(500).json({ error: "Erreur récupération statistiques" });
    }
  }
);

trainingStatRouter.patch(
  "/update/:id",
  authMiddleware,
  validateMiddleware({ body: updateTrainingStatBody }),
  async (req, res): Promise<void> => {
    try {
      const updates = req.body as UpdateTrainingStatInput;
      const updated = await TrainingStatModel.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true }
      );
      if (!updated) {
        res.status(404).json({ error: "Statistique introuvable" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Erreur mise à jour" });
    }
  }
);

trainingStatRouter.delete(
  "/:id",
  authMiddleware,
  async (req, res): Promise<void> => {
    try {
      await TrainingStatModel.findByIdAndDelete(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erreur suppression" });
    }
  }
);

export { trainingStatRouter };
