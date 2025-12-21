import { Request, Response, NextFunction } from "express";
import { GymModel, UserModel } from "../models";

export function gymOwnershipMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    try {
      const user = await UserModel.findById(req.user.id).exec();
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.role === "admin") {
        return next();
      }

      if (user.role === "manager") {
        const gymId = req.params.id;
        
        if (!gymId) {
          return res.status(400).json({ error: "Gym ID required" });
        }

        const gym = await GymModel.findById(gymId).exec();
        
        if (!gym) {
          return res.status(404).json({ error: "Gym not found" });
        }

        if (gym.owner.toString() !== req.user.id) {
          return res.status(403).json({ 
            error: "Access denied: You can only manage your own gyms" 
          });
        }

        return next();
      }

      return res.status(403).json({ 
        error: "Access denied: Insufficient permissions" 
      });

    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function userOwnershipMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    try {
      const user = await UserModel.findById(req.user.id).exec();
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.role === "admin") {
        return next();
      }

      const targetUserId = req.params.id;

      if (req.user.id !== targetUserId) {
        return res.status(403).json({ 
          error: "Access denied: You can only modify your own profile" 
        });
      }

      next();

    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}
