import { ScoreModel } from "../models/scoreModel";
import { Types } from "mongoose";

const POINTS_BY_DIFFICULTY = {
    beginner: 10,
    intermediate: 20,
    advanced: 30
};

const SOCIAL_CHALLENGE_BONUS = 15;

export const addPointsForChallenge = async (
    userId: string | Types.ObjectId,
    difficulty: "beginner" | "intermediate" | "advanced",
    isSocialChallenge: boolean = false
): Promise<void> => {
    try {
        const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
        
        let points = POINTS_BY_DIFFICULTY[difficulty];

        if (isSocialChallenge) {
            points += SOCIAL_CHALLENGE_BONUS;
        }

        const score = await ScoreModel.findOne({ user: userObjectId });
        
        if (score) {
            score.totalPoints += points;
            score.challengesCompleted += 1;
            await score.save();
        } else {
            await ScoreModel.create({
                user: userObjectId,
                totalPoints: points,
                challengesCompleted: 1,
                badgesEarned: 0
            });
        }
    } catch (error) {
        console.error('Erreur lors de l\'ajout des points:', error);
        throw new Error('Impossible d\'ajouter les points');
    }
};

export const addPointsForMultipleParticipants = async (
    participantIds: (string | Types.ObjectId)[],
    difficulty: "beginner" | "intermediate" | "advanced",
    isSocialChallenge: boolean = false
): Promise<void> => {
    try {
        const promises = participantIds.map(participantId => 
            addPointsForChallenge(participantId, difficulty, isSocialChallenge)
        );
        
        await Promise.all(promises);
    } catch (error) {
        console.error('Erreur lors de l\'ajout des points pour plusieurs participants:', error);
        throw new Error('Impossible d\'ajouter les points pour tous les participants');
    }
};

export const getPointsForDifficulty = (
    difficulty: "beginner" | "intermediate" | "advanced",
    isSocialChallenge: boolean = false
): number => {
    let points = POINTS_BY_DIFFICULTY[difficulty];
    if (isSocialChallenge) {
        points += SOCIAL_CHALLENGE_BONUS;
    }
    return points;
};
