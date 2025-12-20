import { ScoreModel } from "../models/scoreModel";

export class StreakService {
    
    
    static async updateStreak(userId: string): Promise<void> {
        try {
            const score = await ScoreModel.findOne({ user: userId });
            if (!score) return;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const lastActivity = score.lastActivityDate;

            if (!lastActivity) {
               
                score.currentStreak = 1;
                score.longestStreak = 1;
            } else {
                const lastActivityDate = new Date(lastActivity);
                lastActivityDate.setHours(0, 0, 0, 0);

                const diffDays = Math.floor(
                    (today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
                );

                if (diffDays === 0) {
                    
                } else if (diffDays === 1) {
                   
                    score.currentStreak += 1;
                    if (score.currentStreak > score.longestStreak) {
                        score.longestStreak = score.currentStreak;
                    }
                } else {
                 
                    score.currentStreak = 1;
                }
            }

            score.lastActivityDate = new Date();
            await score.save();
        } catch (error) {
            console.error("Erreur mise à jour streak:", error);
        }
    }

   
    static async checkExpiredStreaks(): Promise<void> {
        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(23, 59, 59, 999);

            
            await ScoreModel.updateMany(
                {
                    lastActivityDate: { $lt: yesterday },
                    currentStreak: { $gt: 0 }
                },
                { $set: { currentStreak: 0 } }
            );
        } catch (error) {
            console.error("Erreur vérification streaks expirés:", error);
        }
    }
}