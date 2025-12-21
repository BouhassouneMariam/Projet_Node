import { Router } from "express";
import {
  authMiddleware,
  validateMiddleware,
  roleMiddleware,
} from "../middlewares";
import {
  createBadgeRuleBody,
  CreateBadgeRuleInput,
  updateBadgeRuleBody,
  UpdateBadgeRuleInput,
} from "../schemas";
import { BadgeRuleModel } from "../models";

const badgeRuleRouter = Router();

badgeRuleRouter.get(
  "/getAll",
  authMiddleware,
  async (req, res): Promise<void> => {
    try {
      const list = await BadgeRuleModel.find().exec();
      res.status(200).json(list);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération des règles de badges" });
    }
  }
);

badgeRuleRouter.get(
  "/get/:id",
  authMiddleware,
  async (req, res): Promise<void> => {
    try {
      const rule = await BadgeRuleModel.findById(req.params.id).exec();
      if (!rule) {
        res.status(404).json({ error: "Règle de badge non trouvée" });
        return;
      }
      res.status(200).json(rule);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération de la règle de badge" });
    }
  }
);

badgeRuleRouter.get(
  "/active",
  authMiddleware,
  async (req, res): Promise<void> => {
    try {
      const list = await BadgeRuleModel.find({ isActive: true }).exec();
      res.status(200).json(list);
    } catch (error) {
      res
        .status(500)
        .json({
          error: "Erreur lors de la récupération des règles de badges actives",
        });
    }
  }
);

badgeRuleRouter.get(
  "/badge",
  authMiddleware,
  async (req, res): Promise<void> => {
    try {
      const { name } = req.query;
      if (!name || typeof name !== "string") {
        res
          .status(400)
          .json({
            error: "Le nom du badge est requis comme paramètre de requête",
          });
        return;
      }
      const rules = await BadgeRuleModel.find({ badgeName: name }).exec();
      res.status(200).json(rules);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération des règles de badges" });
    }
  }
);

badgeRuleRouter.post(
  "/create",
  authMiddleware,
  roleMiddleware(["admin"]),
  validateMiddleware({ body: createBadgeRuleBody }),
  async (req, res): Promise<void> => {
    try {
      const input = req.body as CreateBadgeRuleInput;
      const created = await BadgeRuleModel.create(input);
      res.status(201).json({ message: "Règle de badge créée", data: created });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la création de la règle de badge" });
    }
  }
);

badgeRuleRouter.patch(
  "/update/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  validateMiddleware({ body: updateBadgeRuleBody }),
  async (req, res): Promise<void> => {
    try {
      const id = req.params.id;
      const updates = req.body as UpdateBadgeRuleInput;
      const updated = await BadgeRuleModel.findByIdAndUpdate(id, updates, {
        new: true,
      }).exec();
      if (!updated) {
        res.status(404).json({ error: "Règle de badge non trouvée" });
        return;
      }
      res.json(updated);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la mise à jour de la règle de badge" });
    }
  }
);

badgeRuleRouter.patch(
  "/toggle/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res): Promise<void> => {
    try {
      const id = req.params.id;
      const rule = await BadgeRuleModel.findById(id).exec();
      if (!rule) {
        res.status(404).json({ error: "Règle de badge non trouvée" });
        return;
      }
      rule.isActive = !rule.isActive;
      await rule.save();
      res.json({
        message: `Règle ${rule.isActive ? "activée" : "désactivée"}`,
        data: rule,
      });
    } catch (error) {
      res
        .status(500)
        .json({
          error: "Erreur lors du changement d'état de la règle de badge",
        });
    }
  }
);

badgeRuleRouter.delete(
  "/delete/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = await BadgeRuleModel.findByIdAndDelete(id).exec();
      if (!deleted) {
        res.status(404).json({ error: "Règle de badge non trouvée" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la suppression de la règle de badge" });
    }
  }
);

badgeRuleRouter.delete(
  "/deleteAll",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res): Promise<void> => {
    try {
      await BadgeRuleModel.deleteMany({});
      res.status(204).send();
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la suppression des règles de badges" });
    }
  }
);

export { badgeRuleRouter };