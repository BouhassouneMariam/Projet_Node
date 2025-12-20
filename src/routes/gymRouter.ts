import { Router } from "express";
import {
  validateMiddleware,
  authMiddleware,
  roleMiddleware,
} from "../middlewares";
import {
  createGymBody,
  updateGymBody,
  approveGymBody,
  exerciseTypesBody,
  CreateGymInput,
} from "../schemas";
import { GymModel, UserModel } from "../models";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; 
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

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
  "/:id",
  authMiddleware,
  validateMiddleware({ body: updateGymBody }),
  async (req, res): Promise<void> => {
    try {
      const { id } = req.params;
      const updates = req.body;

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

      const updatedGym = await GymModel.findByIdAndUpdate(id, updates, {
        new: true,
      }).exec();
      res.status(200).json({ message: "Salle mise à jour", gym: updatedGym });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la mise à jour de la salle" });
    }
  }
);

gymRouter.delete("/:id", authMiddleware, async (req, res): Promise<void> => {
  try {
    const { id } = req.params;

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



gymRouter.get("/nearby", async (req, res): Promise<void> => {
    try {
        const { longitude, latitude, maxDistance = 5000 } = req.query;

        if (!longitude || !latitude) {
            res.status(400).json({ 
                error: "Les paramètres longitude et latitude sont requis" 
            });
            return;
        }

        const lng = parseFloat(longitude as string);
        const lat = parseFloat(latitude as string);
        const distance = parseInt(maxDistance as string);

        if (isNaN(lng) || isNaN(lat)) {
            res.status(400).json({ error: "Coordonnées invalides" });
            return;
        }

        const gyms = await GymModel.find({
            approved: true,
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [lng, lat]
                    },
                    $maxDistance: distance
                }
            }
        })
            .populate("owner", "firstname lastname")
            .populate("exerciseTypes", "name difficulty")
            .exec();

        
        const gymsWithDistance = gyms.map(gym => {
            const gymCoords = gym.location?.coordinates;
            let distanceKm = null;
            
            if (gymCoords) {
                distanceKm = calculateDistance(lat, lng, gymCoords[1], gymCoords[0]);
            }

            return {
                ...gym.toObject(),
                distanceKm: distanceKm ? Math.round(distanceKm * 100) / 100 : null,
                distanceFormatted: distanceKm 
                    ? distanceKm < 1 
                        ? `${Math.round(distanceKm * 1000)} m`
                        : `${Math.round(distanceKm * 10) / 10} km`
                    : null
            };
        });

        res.status(200).json({
            count: gymsWithDistance.length,
            searchCenter: { longitude: lng, latitude: lat },
            maxDistance: `${distance} m`,
            gyms: gymsWithDistance
        });
    } catch (error) {
        console.error("Erreur recherche proximité:", error);
        res.status(500).json({ error: "Erreur lors de la recherche" });
    }
});


gymRouter.get("/city/:cityName", async (req, res): Promise<void> => {
    try {
        const { cityName } = req.params;

        const gyms = await GymModel.find({
            approved: true,
            city: { $regex: new RegExp(cityName, 'i') }
        })
            .populate("owner", "firstname lastname")
            .populate("exerciseTypes", "name difficulty")
            .exec();

        res.status(200).json({
            count: gyms.length,
            city: cityName,
            gyms
        });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la recherche par ville" });
    }
});


gymRouter.patch(
    "/:id/location",
    authMiddleware,
    async (req, res): Promise<void> => {
        try {
            const { id } = req.params;
            const { longitude, latitude, city, postalCode, country } = req.body;

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

            
            if (longitude !== undefined && latitude !== undefined) {
                gym.location = {
                    type: "Point",
                    coordinates: [longitude, latitude]
                };
            }

            if (city) gym.city = city;
            if (postalCode) gym.postalCode = postalCode;
            if (country) gym.country = country;

            await gym.save();

            res.status(200).json({
                message: "Localisation mise à jour",
                gym
            });
        } catch (error) {
            res.status(500).json({ error: "Erreur mise à jour localisation" });
        }
    }
);


gymRouter.get("/cities/list", async (req, res): Promise<void> => {
    try {
        const cities = await GymModel.aggregate([
            { $match: { approved: true, city: { $exists: true, $ne: null } } },
            { $group: { _id: "$city", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.status(200).json(cities.map(c => ({
            city: c._id,
            gymCount: c.count
        })));
    } catch (error) {
        res.status(500).json({ error: "Erreur récupération des villes" });
    }
});

export { gymRouter };