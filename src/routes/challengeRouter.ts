import { Router } from "express";
import { Types } from "mongoose";
import { validateMiddleware, authMiddleware, roleMiddleware } from "../middlewares";
import {
  createChallengeBody,
  CreateChallengeInput,
  updateChallengeBody,
  UpdateChallengeInput,
  joinChallengeBody,
  completeChallengeBody,
  shareChallengeBody,
  ShareChallengeInput,
  markShareSeenBody,
} from "../schemas";
import {
  ChallengeModel,
  GymModel,
  ChallengeShareModel,
  UserModel,
} from "../models";
import { addPointsForChallenge } from "../utils/scoreService";
import { RewardService } from "../utils/rewardService";
import { BadgeService } from "../utils/badgeService";

const challengeRouter = Router();

async function validateExerciseTypeInGym(
  gymId: string,
  exerciseTypeId: string
): Promise<string | null> {
  const gym = await GymModel.findById(gymId).exec();
  if (!gym) {
    return "Salle non trouvée";
  }

  const exerciseTypeExists = gym.exerciseTypes.some(
    (et) => et.toString() === exerciseTypeId
  );

  if (!exerciseTypeExists) {
    return "Le type d'exercice spécifié n'est pas disponible dans cette salle";
  }

  return null;
}

challengeRouter.get("/getAll", async (req, res): Promise<void> => {
  try {
    const challenges = await ChallengeModel.find()
      .populate("creator", "firstname lastname email")
      .populate("exerciseType", "name difficulty")
      .populate("gym", "name")
      .sort({ createdAt: -1 })
      .exec();
    res.status(200).json(challenges);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération des défis" });
  }
});

challengeRouter.get("/filter", async (req, res): Promise<void> => {
  try {
    const { difficulty, exerciseType, duration, gymId } = req.query;
    const filter: Record<string, unknown> = {};

    if (difficulty) filter.difficulty = difficulty;
    if (exerciseType) filter.exerciseType = exerciseType;
    if (duration) filter.duration = { $lte: parseInt(duration as string) };
    if (gymId) filter.gym = gymId;

    const challenges = await ChallengeModel.find(filter)
      .populate("creator", "firstname lastname email")
      .populate("exerciseType", "name difficulty")
      .populate("gym", "name")
      .exec();

    res.status(200).json(challenges);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors du filtrage des défis" });
  }
});

challengeRouter.get(
  "/shared/received",
  authMiddleware,
  async (req, res): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Utilisateur non authentifié" });
        return;
      }

      const { unseen } = req.query;
      const filter: Record<string, unknown> = { sharedWith: req.user.id };

      if (unseen === "true") {
        filter.seen = false;
      }

      const shares = await ChallengeShareModel.find(filter)
        .populate({
          path: "challenge",
          populate: [
            { path: "creator", select: "firstname lastname" },
            { path: "exerciseType", select: "name difficulty" },
            { path: "gym", select: "name" },
          ],
        })
        .populate("sharedBy", "firstname lastname email")
        .sort({ created_at: -1 })
        .exec();

      res.status(200).json(shares);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération des défis partagés" });
    }
  }
);

challengeRouter.get(
  "/shared/sent",
  authMiddleware,
  async (req, res): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Utilisateur non authentifié" });
        return;
      }

      const shares = await ChallengeShareModel.find({ sharedBy: req.user.id })
        .populate({
          path: "challenge",
          populate: [
            { path: "creator", select: "firstname lastname" },
            { path: "exerciseType", select: "name difficulty" },
          ],
        })
        .populate("sharedWith", "firstname lastname email")
        .sort({ created_at: -1 })
        .exec();

      res.status(200).json(shares);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération des défis envoyés" });
    }
  }
);

challengeRouter.post(
  "/create",
  authMiddleware,
  validateMiddleware({ body: createChallengeBody }),
  async (req, res): Promise<void> => {
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
          res
            .status(403)
            .json({
              error: "Seul le propriétaire peut créer un défi pour cette salle",
            });
          return;
        }

        const validationError = await validateExerciseTypeInGym(
          input.gym,
          input.exerciseType
        );
        if (validationError) {
          res.status(400).json({ error: validationError });
          return;
        }
      }

      const created = await ChallengeModel.create(input);
      res.status(201).json({ message: "Défi créé", challenge: created });
    } catch (error) {
      res.status(500).json({ error: "Erreur création défi" });
    }
  }
);

challengeRouter.get("/:id", async (req, res): Promise<void> => {
  try {
    const challenge = await ChallengeModel.findById(req.params.id)
      .populate("creator", "firstname lastname")
      .populate("gym", "name")
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

challengeRouter.post(
  "/:id/share",
  authMiddleware,
  validateMiddleware({ body: shareChallengeBody }),
  async (req, res): Promise<void> => {
    try {
      const { id } = req.params;
      const input = req.body as ShareChallengeInput;

      const challenge = await ChallengeModel.findById(id).exec();
      if (!challenge) {
        res.status(404).json({ error: "Défi non trouvé" });
        return;
      }

      const recipients = Array.isArray(input.sharedWith)
        ? input.sharedWith
        : [input.sharedWith];

      if (recipients.includes(req.user!.id)) {
        res
          .status(400)
          .json({
            error: "Vous ne pouvez pas partager un défi avec vous-même",
          });
        return;
      }

      const existingUsers = await UserModel.find({ _id: { $in: recipients } })
        .select("_id")
        .exec();
      const existingUserIds = existingUsers.map((u) =>
        (u._id as Types.ObjectId).toString()
      );
      const invalidUsers = recipients.filter(
        (r) => !existingUserIds.includes(r)
      );

      if (invalidUsers.length > 0) {
        res
          .status(404)
          .json({
            error: `Utilisateur(s) non trouvé(s): ${invalidUsers.join(", ")}`,
          });
        return;
      }

      const sharePromises = recipients.map(async (recipientId) => {
        try {
          return await ChallengeShareModel.create({
            challenge: id,
            sharedBy: req.user!.id,
            sharedWith: recipientId,
            message: input.message,
          });
        } catch (error: unknown) {
          if (
            error &&
            typeof error === "object" &&
            "code" in error &&
            error.code === 11000
          ) {
            return { skipped: true, recipientId };
          }
          throw error;
        }
      });

      const results = await Promise.all(sharePromises);
      const created = results.filter(
        (
          r
        ): r is Exclude<typeof r, { skipped: boolean; recipientId: string }> =>
          !r || !("skipped" in r)
      );
      const skipped = results.filter(
        (r): r is { skipped: boolean; recipientId: string } =>
          !!r && "skipped" in r
      );

      res.status(201).json({
        message: "Défi partagé avec succès",
        shared: created.length,
        alreadyShared: skipped.length,
        recipients: recipients.length,
      });
    } catch (error) {
      res.status(500).json({ error: "Erreur lors du partage du défi" });
    }
  }
);

challengeRouter.patch(
  "/shared/:shareId/seen",
  authMiddleware,
  roleMiddleware(["admin", "manager"]),
  validateMiddleware({ body: markShareSeenBody }),
  async (req, res): Promise<void> => {
    try {
      const { shareId } = req.params;
      const { seen } = req.body;

      if (!req.user) {
        res.status(401).json({ error: "Utilisateur non authentifié" });
        return;
      }

      const share = await ChallengeShareModel.findById(shareId).exec();
      if (!share) {
        res.status(404).json({ error: "Partage non trouvé" });
        return;
      }

      if (share.sharedWith.toString() !== req.user.id) {
        res
          .status(403)
          .json({ error: "Vous n'êtes pas autorisé à modifier ce partage" });
        return;
      }

      share.seen = seen;
      await share.save();

      res
        .status(200)
        .json({
          message: seen ? "Marqué comme vu" : "Marqué comme non vu",
          share,
        });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la mise à jour du partage" });
    }
  }
);

challengeRouter.post(
  "/:id/join",
  authMiddleware,
  validateMiddleware({ body: joinChallengeBody }),
  async (req, res): Promise<void> => {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      const challenge = await ChallengeModel.findById(id).exec();
      if (!challenge) {
        res.status(404).json({ error: "Défi non trouvé" });
        return;
      }

      if (!challenge.participants.some((p) => p.toString() === userId)) {
        challenge.participants.push(new Types.ObjectId(userId));
        await challenge.save();
      }
      res.status(200).json({ message: "Rejoint avec succès" });
    } catch (error) {
      res.status(500).json({ error: "Erreur join" });
    }
  }
);

challengeRouter.patch(
  "/update/:id",
  authMiddleware,
  validateMiddleware({ body: updateChallengeBody }),
  async (req, res): Promise<void> => {
    try {
      const updates = req.body as UpdateChallengeInput;
      const challengeId = req.params.id;

      const existingChallenge = await ChallengeModel.findById(
        challengeId
      ).exec();
      if (!existingChallenge) {
        res.status(404).json({ error: "Défi non trouvé" });
        return;
      }

      const finalGymId =
        updates.gym !== undefined
          ? updates.gym
          : existingChallenge.gym?.toString();
      const finalExerciseTypeId =
        updates.exerciseType !== undefined
          ? updates.exerciseType
          : existingChallenge.exerciseType.toString();

      if (finalGymId && finalExerciseTypeId) {
        const validationError = await validateExerciseTypeInGym(
          finalGymId,
          finalExerciseTypeId
        );
        if (validationError) {
          res.status(400).json({ error: validationError });
          return;
        }
      }

      const updated = await ChallengeModel.findByIdAndUpdate(
        challengeId,
        updates,
        { new: true }
      ).exec();
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Erreur update" });
    }
  }
);

challengeRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin", "manager"]),
  async (req, res): Promise<void> => {
    try {
      const deleted = await ChallengeModel.findByIdAndDelete(
        req.params.id
      ).exec();
      if (!deleted) {
        res.status(404).json({ error: "Défi non trouvé" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erreur delete" });
    }
  }
);

challengeRouter.post(
  "/:id/complete",
  authMiddleware,
  validateMiddleware({ body: completeChallengeBody }),
  async (req, res): Promise<void> => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!id || !Types.ObjectId.isValid(id)) {
        res.status(400).json({ error: "ID de défi invalide" });
        return;
      }

      const challenge = await ChallengeModel.findById(id).exec();

      if (!challenge) {
        res.status(404).json({ error: "Défi non trouvé" });
        return;
      }

      if (req.user?.id !== userId) {
        res
          .status(403)
          .json({
            error:
              "Vous ne pouvez compléter ce défi que pour votre propre compte",
          });
        return;
      }

      const isParticipant = challenge.participants.some(
        (p) => p.toString() === userId
      );
      if (!isParticipant) {
        res.status(403).json({ error: "Vous ne participez pas à ce défi" });
        return;
      }

      await addPointsForChallenge(userId, challenge.difficulty, false);

      await RewardService.awardForChallengeComplete(
        userId,
        id,
        challenge.difficulty
      );
      await BadgeService.checkAndAwardAllBadges(userId);

      res.status(200).json({
        message: "Défi complété avec succès",
        pointsEarned:
          challenge.difficulty === "beginner"
            ? 10
            : challenge.difficulty === "intermediate"
            ? 20
            : 30,
      });
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la complétion du défi" });
    }
  }
);

export { challengeRouter };
