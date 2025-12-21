import { Router } from "express";
import { authMiddleware, validateMiddleware } from "../middlewares";
import {
  createSocialChallengeBody,
  updateSocialChallengeStatusBody,
} from "../schemas/socialChallengeSchema";
import { SocialChallengeModel, ChallengeModel } from "../models";
import { addPointsForChallenge } from "../utils/scoreService";
import { RewardService } from "../utils/rewardService";
import { BadgeService } from "../utils/badgeService";

const socialRouter = Router();

socialRouter.post(
  "/invite",
  authMiddleware,
  validateMiddleware({ body: createSocialChallengeBody }),
  async (req, res): Promise<void> => {
    const created = await SocialChallengeModel.create(req.body);
    res.status(201).json(created);
  }
);

socialRouter.patch(
  "/:id/status",
  authMiddleware,
  validateMiddleware({ body: updateSocialChallengeStatusBody }),
  async (req, res): Promise<void> => {
    const { status } = req.body;
    const updated = await SocialChallengeModel.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.status(200).json(updated);
  }
);

socialRouter.get(
  "/invitations/:userId",
  authMiddleware,
  async (req, res): Promise<void> => {
    const invites = await SocialChallengeModel.find({
      invitee: req.params.userId,
      status: "pending",
    }).populate("challenge", "title");
    res.status(200).json(invites);
  }
);

socialRouter.post(
  "/:id/complete",
  authMiddleware,
  async (req, res): Promise<void> => {
    try {
      const socialChallengeId = req.params.id;

      if (!socialChallengeId) {
        res.status(400).json({ error: "ID du défi social requis" });
        return;
      }

      const socialChallenge = await SocialChallengeModel.findById(
        socialChallengeId
      )
        .populate("challenge")
        .exec();

      if (!socialChallenge) {
        res.status(404).json({ error: "Défi social non trouvé" });
        return;
      }

      if (socialChallenge.status === "completed") {
        res.status(400).json({ error: "Ce défi est déjà complété" });
        return;
      }

      if (socialChallenge.status !== "accepted") {
        res
          .status(400)
          .json({ error: "Le défi doit être accepté avant d'être complété" });
        return;
      }

      const challenge = await ChallengeModel.findById(
        socialChallenge.challenge
      ).exec();
      if (!challenge) {
        res.status(404).json({ error: "Défi associé non trouvé" });
        return;
      }

      const inviterId = socialChallenge.inviter.toString();
      const inviteeId = socialChallenge.invitee.toString();

      await Promise.all([
        addPointsForChallenge(inviterId, challenge.difficulty, true),
        addPointsForChallenge(inviteeId, challenge.difficulty, true),
      ]);

      await Promise.all([
        RewardService.awardForSocialComplete(
          inviterId,
          socialChallengeId,
          challenge.difficulty
        ),
        RewardService.awardForSocialComplete(
          inviteeId,
          socialChallengeId,
          challenge.difficulty
        ),
      ]);

      await Promise.all([
        BadgeService.checkAndAwardAllBadges(inviterId),
        BadgeService.checkAndAwardAllBadges(inviteeId),
      ]);

      socialChallenge.status = "completed";
      await socialChallenge.save();

      const basePoints =
        challenge.difficulty === "beginner"
          ? 10
          : challenge.difficulty === "intermediate"
          ? 20
          : 30;
      const totalPoints = basePoints + 15;

      res.status(200).json({
        message: "Défi social complété avec succès",
        pointsEarned: totalPoints,
        breakdown: {
          basePoints,
          socialBonus: 15,
        },
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la complétion du défi social" });
    }
  }
);

export { socialRouter };
