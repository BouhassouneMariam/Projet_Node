import { Schema, model, Document, Types } from "mongoose";

export interface IScore extends Document {
    user: Types.ObjectId;
    totalPoints: number;
    challengesCompleted: number;
    badgesEarned: number;
    totalTrainingSessions: number;
    totalTrainingMinutes: number;
    currentStreak: number;  
    longestStreak: number;  
    lastActivityDate: Date | null;
    socialChallengesCompleted: number;
    totalWeightLifted: number;      
    totalRepsCompleted: number;     
    totalDistanceCovered: number;   
    totalCaloriesBurned: number;    
    createdAt: Date;
    updatedAt: Date;
}


const scoreSchema = new Schema<IScore>({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    totalPoints: { type: Number, default: 0 },
    challengesCompleted: { type: Number, default: 0 },
    badgesEarned: { type: Number, default: 0 },
    totalTrainingSessions: { type: Number, default: 0 },
    totalTrainingMinutes: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActivityDate: { type: Date, default: null },
    socialChallengesCompleted: { type: Number, default: 0 },
    totalWeightLifted: { type: Number, default: 0 },
    totalRepsCompleted: { type: Number, default: 0 },
    totalDistanceCovered: { type: Number, default: 0 },
    totalCaloriesBurned: { type: Number, default: 0 }
}, { timestamps: true });

scoreSchema.index({ totalPoints: -1 });
scoreSchema.index({ totalTrainingSessions: -1 });
scoreSchema.index({ currentStreak: -1 });
scoreSchema.index({ totalWeightLifted: -1 });
scoreSchema.index({ totalDistanceCovered: -1 });

export const ScoreModel = model<IScore>("Score", scoreSchema);