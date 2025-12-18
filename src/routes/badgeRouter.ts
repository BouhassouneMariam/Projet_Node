import { Router } from "express";
import { authMiddleware, validateMiddleware, roleMiddleware } from "../middlewares";
import { createBadgeBody, CreateBadgeInput, updateBadgeBody, UpdateBadgeInput } from "../schemas";
import { BadgeModel } from "../models";

const badgeRouter = Router();

// ✅ GET ALL - Tous les utilisateurs authentifiés
badgeRouter.get('/getAll', authMiddleware, async (req, res): Promise<void> => {
    const list = await BadgeModel.find().exec();
    res.status(200).json(list);
})

// ✅ GET BY ID - Tous les utilisateurs authentifiés
badgeRouter.get('/get/:id', authMiddleware, async (req, res): Promise<void> => {
    const badge = await BadgeModel.findById(req.params.id).exec();
    if (!badge) {
        res.status(404).json({ error: 'Badge not found' });
        return;
    }
    res.status(200).json(badge);
})

// ✅ CREATE - Admin uniquement
badgeRouter.post('/create', authMiddleware, roleMiddleware(["admin"]), validateMiddleware({ body: createBadgeBody }), async (req, res): Promise<void> => {
    const input = req.body as CreateBadgeInput;
    const created = await BadgeModel.create(input);
    const message = created && typeof created === "object" ? "badge created" : "error";
    res.status(201).send(message);
})

// ✅ UPDATE - Admin uniquement
badgeRouter.patch('/update/:id', authMiddleware, roleMiddleware(["admin"]), validateMiddleware({ body: updateBadgeBody }), async (req, res): Promise<void> => {
    const id = req.params.id;
    const updates = req.body as UpdateBadgeInput;
    const updated = await BadgeModel.findByIdAndUpdate(id, updates, { new: true }).exec();
    if (!updated) {
        res.status(404).json({ error: 'Badge not found' });
        return;
    }
    res.json(updated);
});

// ✅ DELETE - Admin uniquement
badgeRouter.delete('/delete/:id', authMiddleware, roleMiddleware(["admin"]), async (req, res): Promise<void> => {
    const { id } = req.params;
    const deleted = await BadgeModel.findByIdAndDelete(id).exec();
    if (!deleted) {
        res.status(404).json({ error: 'Badge not found' });
        return;
    }
    res.status(204).send();
})

// ✅ DELETE ALL - Admin uniquement
badgeRouter.delete('/deleteAll', authMiddleware, roleMiddleware(["admin"]), async (req, res): Promise<void> => {
    await BadgeModel.deleteMany({});
    res.status(204).send();
})

export { badgeRouter };