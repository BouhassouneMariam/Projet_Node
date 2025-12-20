import { Router } from "express";
import {
  validateMiddleware,
  authMiddleware,
  roleMiddleware,
} from "../middlewares";
import {
  createUserBody,
  CreateUserInput,
  updateUserBody,
  UpdateUserInput,
  authUserBody,
} from "../schemas";
import {
  IUser,
  UserModel,
  GymModel,
  ChallengeModel,
  SocialChallengeModel,
  TrainingStatModel,
  ScoreModel,
  UserBadgeModel,
} from "../models";
import { signAccessToken } from "../utils/jwt";

const userRouter = Router();

userRouter.get("/getAll", authMiddleware, async (req, res): Promise<void> => {
  const list = await UserModel.find().exec();
  res.status(200).json(list);
});

userRouter.get("/get/:id", authMiddleware, async (req, res): Promise<void> => {
  const list = await UserModel.findById(req.params.id).exec();
  res.status(200).json(list);
});

userRouter.post(
  "/create",
  validateMiddleware({ body: createUserBody }),
  async (req, res): Promise<void> => {
    const input = req.body as CreateUserInput;
    const created = await UserModel.create(input);
    const message =
      created && typeof created === "object" ? "user created" : "error";
    res.status(201).send(message);
  }
);

userRouter.post(
  "/auth",
  validateMiddleware({ body: authUserBody }),
  async (req, res): Promise<void> => {
    const { email, password } = req.body;

    const user: IUser | null = await UserModel.findOne({ email })
      .select("+password")
      .exec();
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    if (!user.active) {
      res
        .status(403)
        .json({ error: "Account disabled. Contact administrator." });
      return;
    }

    const isValid = await user.verifyPassword(password);
    if (!isValid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const token = signAccessToken({ sub: user.id });
    res.json({ ok: true, token, id: user.id });
  }
);

userRouter.patch(
  "/toggle-active/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res): Promise<void> => {
    try {
      const { id } = req.params;

      const user = await UserModel.findById(id).exec();
      if (!user) {
        res.status(404).json({ error: "Utilisateur non trouvé" });
        return;
      }

      user.active = !user.active;
      await user.save();

      res.status(200).json({
        message: user.active ? "Utilisateur activé" : "Utilisateur désactivé",
        user: {
          id: user.id,
          email: user.email,
          active: user.active,
        },
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la modification du statut" });
    }
  }
);

userRouter.get(
  "/status/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res): Promise<void> => {
    try {
      const user = await UserModel.findById(
        req.params.id,
        "firstname lastname email role active"
      ).exec();
      if (!user) {
        res.status(404).json({ error: "Utilisateur non trouvé" });
        return;
      }
      res.status(200).json(user);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération du statut" });
    }
  }
);

userRouter.patch(
  "/update/:id",
  authMiddleware,
  validateMiddleware({ body: updateUserBody }),
  async (req, res): Promise<void> => {
    const id = req.params.id;
    const updates = req.body as UpdateUserInput;
    if (updates.password) {
      const user = await UserModel.findById(id).select("+password");
      if (!user) res.status(404).json({ error: "User not found" });
      else {
        user.password = updates.password;
        Object.assign(user, updates);
        await user.save();
        res.json({ ok: true, id: user.id });
      }
    }
    const updated = await UserModel.findByIdAndUpdate(id, updates, {
      new: true,
    }).exec();
    if (!updated) res.status(404).json({ error: "User not found" });
    else res.json(updated);
  }
);

userRouter.get(
  "/preview-delete/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res): Promise<void> => {
    try {
      const { id } = req.params;

      const user = await UserModel.findById(id).exec();
      if (!user) {
        res.status(404).json({ error: "Utilisateur non trouvé" });
        return;
      }

      const gyms = await GymModel.countDocuments({ owner: id }).exec();
      const challengesCreated = await ChallengeModel.countDocuments({
        creator: id,
      }).exec();
      const socialChallenges = await SocialChallengeModel.countDocuments({
        $or: [{ inviter: id }, { invitee: id }],
      }).exec();
      const trainingStats = await TrainingStatModel.countDocuments({
        user: id,
      }).exec();
      const badges = await UserBadgeModel.countDocuments({ user: id }).exec();

      const userGyms = await GymModel.find({ owner: id }).exec();
      const gymIds = userGyms.map((gym) => gym._id);
      const challengesInGyms = await ChallengeModel.countDocuments({
        gym: { $in: gymIds },
      }).exec();

      res.status(200).json({
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          firstname: user.firstname,
          lastname: user.lastname,
        },
        dataToBeDeleted: {
          gymsOwned: gyms,
          challengesCreated,
          challengesInOwnedGyms: challengesInGyms,
          socialChallenges,
          trainingStats,
          badgesEarned: badges,
        },
        warning:
          "La suppression de cet utilisateur entraînera la suppression de toutes ces données.",
      });
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la prévisualisation" });
    }
  }
);

userRouter.delete(
  "/delete/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res): Promise<void> => {
    try {
      const { id } = req.params;

      const userToDelete = await UserModel.findById(id).exec();
      if (!userToDelete) {
        res.status(404).json({ error: "Utilisateur non trouvé" });
        return;
      }

      if (userToDelete.role === "manager") {
        const userGyms = await GymModel.find({ owner: id }).exec();
        const gymIds = userGyms.map((gym) => gym._id);

        await ChallengeModel.deleteMany({ gym: { $in: gymIds } }).exec();

        await GymModel.deleteMany({ owner: id }).exec();
      }

      await ChallengeModel.deleteMany({ creator: id }).exec();

      await SocialChallengeModel.deleteMany({
        $or: [{ inviter: id }, { invitee: id }],
      }).exec();

      await TrainingStatModel.deleteMany({ user: id }).exec();

      await ScoreModel.deleteMany({ user: id }).exec();

      await UserBadgeModel.deleteMany({ user: id }).exec();

      await UserModel.findByIdAndDelete(id).exec();

      res.status(200).json({
        message:
          "Utilisateur et toutes ses données associées supprimés avec succès",
      });
    } catch (error) {
      console.error("Erreur suppression utilisateur:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la suppression de l'utilisateur" });
    }
  }
);

userRouter.delete(
  "/deleteAll",
  authMiddleware,
  async (req, res): Promise<void> => {
    await UserModel.deleteMany({});
    res.status(204).send();
  }
);

export { userRouter };
