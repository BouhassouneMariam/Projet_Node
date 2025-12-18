import { Router } from "express";
import { validateMiddleware, authMiddleware, roleMiddleware } from "../middlewares";
import { createUserBody, CreateUserInput, updateUserBody, UpdateUserInput } from "../schemas";
import { IUser, UserModel } from "../models";
import { signAccessToken } from "../utils/jwt";

const userRouter = Router();

// ✅ GET ALL - Admin uniquement
userRouter.get('/getAll', authMiddleware, roleMiddleware(["admin"]), async (req, res): Promise<void> => {
    const list = await UserModel.find().select('-password').exec();
    res.status(200).json(list);
})

// ✅ GET BY ID - Admin uniquement OU son propre profil
userRouter.get('/get/:id', authMiddleware, async (req, res): Promise<void> => {
    const { id } = req.params;
    
    // Récupérer l'utilisateur connecté
    const currentUser = await UserModel.findById(req.user?.id).exec();
    
    // Vérifier : soit c'est son propre profil, soit c'est un admin
    if (req.user?.id !== id && currentUser?.role !== 'admin') {
        res.status(403).json({ error: 'Access denied' });
        return;
    }
    
    const user = await UserModel.findById(id).select('-password').exec();
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    res.status(200).json(user);
})

// ✅ CREATE - Public (pour l'inscription)
userRouter.post('/create', validateMiddleware({ body: createUserBody }), async (req, res): Promise<void> => {
    const input = req.body as CreateUserInput;
    const created = await UserModel.create(input);
    const message = created && typeof created === "object" ? "user created" : "error";
    res.status(201).send(message);
})

// ✅ AUTH - Public (connexion)
userRouter.post('/auth', async (req, res): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
    }

    const user: IUser | null = await UserModel.findOne({ email }).select('+password').exec();
    if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
    }

    // Vérif si le compte est actif
    if (!user.active) {
        res.status(403).json({ error: 'Account disabled. Contact administrator.' });
        return;
    }

    const isValid = await user.verifyPassword(password);
    if (!isValid) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
    }
    const token = signAccessToken({ sub: user.id });
    res.json({ ok: true, token, id: user.id });
});

// ✅ TOGGLE ACTIVE - Admin uniquement
userRouter.patch(
  '/toggle-active/:id',
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res): Promise<void> => {
    try {
      const { id } = req.params;
      
      const user = await UserModel.findById(id).exec();
      if (!user) {
        res.status(404).json({ error: 'Utilisateur non trouvé' });
        return;
      }

      user.active = !user.active;
      await user.save();

      res.status(200).json({ 
        message: user.active ? 'Utilisateur activé' : 'Utilisateur désactivé',
        user: {
          id: user.id,
          email: user.email,
          active: user.active
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la modification du statut' });
    }
  }
);

// ✅ STATUS - Admin uniquement
userRouter.get(
  '/status/:id',
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res): Promise<void> => {
    try {
      const user = await UserModel.findById(req.params.id, 'firstname lastname email role active').exec();
      if (!user) {
        res.status(404).json({ error: 'Utilisateur non trouvé' });
        return;
      }
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la récupération du statut' });
    }
  }
);

// ✅ UPDATE - Son propre profil OU admin peut modifier n'importe qui
userRouter.patch('/update/:id', authMiddleware, validateMiddleware({ body: updateUserBody }), async (req, res): Promise<void> => {
    const id = req.params.id;
    const updates = req.body as UpdateUserInput;
    
    // Récupérer l'utilisateur connecté
    const currentUser = await UserModel.findById(req.user?.id).exec();
    
    // Vérifier : soit c'est son propre compte, soit c'est un admin
    if (req.user?.id !== id && currentUser?.role !== 'admin') {
        res.status(403).json({ error: 'Access denied' });
        return;
    }
    
    if (updates.password) {
        const user = await UserModel.findById(id).select('+password');
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        user.password = updates.password;
        Object.assign(user, updates);
        await user.save();
        res.json({ ok: true, id: user.id });
        return;
    }
    
    const updated = await UserModel.findByIdAndUpdate(id, updates, { new: true }).select('-password').exec();
    if (!updated) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    res.json(updated);
});

// ✅ DELETE - Admin uniquement
userRouter.delete('/delete/:id', authMiddleware, roleMiddleware(["admin"]), async (req, res): Promise<void> => {
    const { id } = req.params;
    const deleted = await UserModel.findByIdAndDelete(id).exec();
    if (!deleted) res.status(404).send("user not found");
    else res.status(204).send();
})

// ✅ DELETE ALL - Admin uniquement
userRouter.delete('/deleteAll', authMiddleware, roleMiddleware(["admin"]), async (req, res): Promise<void> => {
    await UserModel.deleteMany({});
    res.status(204).send();
})

export { userRouter };