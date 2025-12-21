import { Router } from "express";
import {
  validateMiddleware,
  authMiddleware,
  roleMiddleware,
  gymOwnershipMiddleware,
} from "../middlewares";
import {
  createGymBody,
  updateGymBody,
  approveGymBody,
  exerciseTypesBody,
  difficultyLevelsBody,
  CreateGymInput,
} from "../schemas";
import { GymModel, UserModel } from "../models";

const gymRouter = Router();

gymRouter.get("/getAll", async (req, res): Promise<void> => {
  try {
    const gyms = await GymModel.find()
      .populate("owner", "firstname lastname email")
      .populate("exerciseTypes", "name difficulty")
      .exec();
    res.status(200).json(gyms);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des salles" });
  }
});

gymRouter.get("/approved", async (req, res): Promise<void> => {
  try {
    const gyms = await GymModel.find({ approved: true })
      .populate("owner", "firstname lastname email")
      .populate("exerciseTypes", "name difficulty")
      .exec();
    res.status(200).json(gyms);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des salles" });
  }
});

gymRouter.get("/pending", async (req, res): Promise<void> => {
  try {
    const gyms = await GymModel.find({ approved: false })
      .populate("owner", "firstname lastname email")
      .populate("exerciseTypes", "name difficulty")
      .exec();
    res.status(200).json(gyms);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des salles en attente" });
  }
});

gymRouter.get(
  "/admin/stats",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res): Promise<void> => {
    try {
      const totalGyms = await GymModel.countDocuments().exec();
      const approvedGyms = await GymModel.countDocuments({ approved: true }).exec();
      const pendingGyms = await GymModel.countDocuments({ approved: false }).exec();

      const stats = {
        total: totalGyms,
        approved: approvedGyms,
        pending: pendingGyms,
        approvalRate: totalGyms > 0 ? ((approvedGyms / totalGyms) * 100).toFixed(2) + '%' : '0%'
      };

      res.status(200).json(stats);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération des statistiques" });
    }
  }
);

gymRouter.get("/:id", async (req, res): Promise<void> => {
  try {
    const gym = await GymModel.findById(req.params.id)
      .populate("owner", "firstname lastname email")
      .populate("exerciseTypes", "name difficulty description")
      .exec();
    if (!gym) {
      res.status(404).json({ error: "Salle non trouvée" });
      return;
    }
    res.status(200).json(gym);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération de la salle" });
  }
});

gymRouter.post(
  "/create",
  authMiddleware,
  roleMiddleware(["admin", "manager"]),
  validateMiddleware({ body: createGymBody }),
  async (req, res): Promise<void> => {
    try {
      const input = req.body as CreateGymInput;
      const currentUser = await UserModel.findById(req.user!.id).exec();

      if (!currentUser) {
        res.status(401).json({ error: "Utilisateur introuvable" });
        return;
      }

      const isAdmin = currentUser.role === "admin";
      let gymData: any = { ...input };

      if (isAdmin) {
        gymData.approved = true;
        const assignedOwner = await UserModel.findById(input.owner).exec();
        if (!assignedOwner) {
          res.status(400).json({ error: "Propriétaire assigné introuvable" });
          return;
        } else if (!["admin", "manager"].includes(assignedOwner.role)) {
          res.status(400).json({ error: "Le propriétaire assigné doit être un admin ou un manager" });
          return;
        }
      } else {
        gymData.owner = currentUser.id;
        gymData.approved = false;
      }

      const gym = await GymModel.create(gymData);
      res.status(201).json({
        message: isAdmin ? "Salle créée et approuvée" : "Salle créée, en attente de validation",
        gym
      });
    } catch (error) {
      res.status(500).json({ error: "Erreur création salle" });
    }
  }
);

gymRouter.patch(
  "/approve/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  validateMiddleware({ body: approveGymBody }),
  async (req, res): Promise<void> => {
    try {
      const { id } = req.params;
      const { approved } = req.body;

      const gym = await GymModel.findByIdAndUpdate(
        id,
        { approved },
        { new: true }
      ).exec();

      if (!gym) {
        res.status(404).json({ error: "Salle non trouvée" });
        return;
      }

      res.status(200).json({ message: "Statut mis à jour", gym });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la mise à jour du statut" });
    }
  }
);


gymRouter.patch(
  "/:id/exerciseTypes",
  authMiddleware,
  roleMiddleware(["admin", "manager"]),
  gymOwnershipMiddleware(),
  validateMiddleware({ body: exerciseTypesBody }),
  async (req, res): Promise<void> => {
    try {
      const { id } = req.params;
      const { exerciseTypes } = req.body;

      const gym = await GymModel.findById(id).exec();
      if (!gym) {
        res.status(404).json({ error: "Salle non trouvée" });
        return;
      }

      gym.exerciseTypes = exerciseTypes;
      await gym.save();

      const populatedGym = await GymModel.findById(id)
        .populate("exerciseTypes", "name difficulty")
        .exec();

      res.status(200).json({ message: "Exercices attribués", gym: populatedGym });
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de l'attribution" });
    }
  }
);


gymRouter.patch(
  "/:id/difficultyLevels",
  authMiddleware,
  validateMiddleware({ body: difficultyLevelsBody }),
  async (req, res): Promise<void> => {
    try {
      const { id } = req.params;
      const { difficultyLevels } = req.body;

      const gym = await GymModel.findById(id).exec();
      if (!gym) {
        res.status(404).json({ error: "Salle non trouvée" });
        return;
      }

      const user = await UserModel.findById(req.user?.id).exec();
      if (!user) {
        res.status(404).json({ error: "Utilisateur non trouvé" });
        return;
      }

      const isOwner = gym.owner.toString() === req.user?.id;
      const isAdmin = user.role === "admin";

      if (!isOwner && !isAdmin) {
        res.status(403).json({ error: "Accès refusé" });
        return;
      }

      gym.difficultyLevels = difficultyLevels;
      await gym.save();

      res.status(200).json({ message: "Niveaux attribués", gym });
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de l'attribution des niveaux" });
    }
  }
);

gymRouter.patch(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin", "manager"]),
  gymOwnershipMiddleware(),
  validateMiddleware({ body: updateGymBody }),
  async (req, res): Promise<void> => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updatedGym = await GymModel.findByIdAndUpdate(id, updates, {
        new: true,
      }).exec();
      if (!updatedGym) {
        res.status(404).json({ error: "Salle non trouvée" });
        return;
      }
      res.status(200).json({ message: "Salle mise à jour", gym: updatedGym });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la mise à jour de la salle" });
    }
  }
);

gymRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin", "manager"]),
  gymOwnershipMiddleware(),
  async (req, res): Promise<void> => {
    try {
      const { id } = req.params;

      await GymModel.findByIdAndDelete(id).exec();
    res.status(204).send();
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la suppression de la salle" });
  }
});

gymRouter.delete(
  "/admin/deleteAll",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res): Promise<void> => {
    try {
      await GymModel.deleteMany({});
      res.status(204).send();
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la suppression des salles" });
    }
  }
);

export { gymRouter };
