import { Router } from "express";
import { authMiddleware, validateMiddleware, roleMiddleware } from "../middlewares";
import { createBadgeRuleBody, CreateBadgeRuleInput, updateBadgeRuleBody, UpdateBadgeRuleInput } from "../schemas";
import { BadgeRuleModel } from "../models";

const badgeRuleRouter = Router();

// ✅ GET ALL - Tous les utilisateurs authentifiés
badgeRuleRouter.get('/getAll', authMiddleware, async (req, res): Promise<void> => {
    try {
        const list = await BadgeRuleModel.find().exec();
        res.status(200).json(list);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching badge rules' });
    }
});

// ✅ GET BY ID - Tous les utilisateurs authentifiés
badgeRuleRouter.get('/get/:id', authMiddleware, async (req, res): Promise<void> => {
    try {
        const rule = await BadgeRuleModel.findById(req.params.id).exec();
        if (!rule) {
            res.status(404).json({ error: 'Badge rule not found' });
            return;
        }
        res.status(200).json(rule);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching badge rule' });
    }
});

// ✅ GET ACTIVE - Tous les utilisateurs authentifiés
badgeRuleRouter.get('/active', authMiddleware, async (req, res): Promise<void> => {
    try {
        const list = await BadgeRuleModel.find({ isActive: true }).exec();
        res.status(200).json(list);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching active badge rules' });
    }
});

// ✅ GET BY BADGE NAME - Tous les utilisateurs authentifiés
badgeRuleRouter.get('/badge', authMiddleware, async (req, res): Promise<void> => {
    try {
        const { name } = req.query;
        if (!name || typeof name !== 'string') {
            res.status(400).json({ error: 'Badge name is required as query parameter' });
            return;
        }
        const rules = await BadgeRuleModel.find({ badgeName: name }).exec();
        res.status(200).json(rules);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching badge rules' });
    }
});

// ✅ CREATE - Admin uniquement
badgeRuleRouter.post('/create', authMiddleware, roleMiddleware(["admin"]), validateMiddleware({ body: createBadgeRuleBody }), async (req, res): Promise<void> => {
    try {
        const input = req.body as CreateBadgeRuleInput;
        const created = await BadgeRuleModel.create(input);
        res.status(201).json({ message: 'Badge rule created', data: created });
    } catch (error) {
        res.status(500).json({ error: 'Error creating badge rule' });
    }
});

// ✅ UPDATE - Admin uniquement
badgeRuleRouter.patch('/update/:id', authMiddleware, roleMiddleware(["admin"]), validateMiddleware({ body: updateBadgeRuleBody }), async (req, res): Promise<void> => {
    try {
        const id = req.params.id;
        const updates = req.body as UpdateBadgeRuleInput;
        const updated = await BadgeRuleModel.findByIdAndUpdate(id, updates, { new: true }).exec();
        if (!updated) {
            res.status(404).json({ error: 'Badge rule not found' });
            return;
        }
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Error updating badge rule' });
    }
});

// ✅ TOGGLE - Admin uniquement
badgeRuleRouter.patch('/toggle/:id', authMiddleware, roleMiddleware(["admin"]), async (req, res): Promise<void> => {
    try {
        const id = req.params.id;
        const rule = await BadgeRuleModel.findById(id).exec();
        if (!rule) {
            res.status(404).json({ error: 'Badge rule not found' });
            return;
        }
        rule.isActive = !rule.isActive;
        await rule.save();
        res.json({ message: `Rule ${rule.isActive ? 'activated' : 'deactivated'}`, data: rule });
    } catch (error) {
        res.status(500).json({ error: 'Error toggling badge rule' });
    }
});

// ✅ DELETE - Admin uniquement
badgeRuleRouter.delete('/delete/:id', authMiddleware, roleMiddleware(["admin"]), async (req, res): Promise<void> => {
    try {
        const { id } = req.params;
        const deleted = await BadgeRuleModel.findByIdAndDelete(id).exec();
        if (!deleted) {
            res.status(404).json({ error: 'Badge rule not found' });
            return;
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error deleting badge rule' });
    }
});

// ✅ DELETE ALL - Admin uniquement
badgeRuleRouter.delete('/deleteAll', authMiddleware, roleMiddleware(["admin"]), async (req, res): Promise<void> => {
    try {
        await BadgeRuleModel.deleteMany({});
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error deleting badge rules' });
    }
});

export { badgeRuleRouter };