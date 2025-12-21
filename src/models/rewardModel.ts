import { Schema, model, Document } from "mongoose";

export interface IReward extends Document {
    name: string;
    description: string;
    type: "trophy" | "medal" | "item" | "title";
    iconUrl: string;
    rarity: "common" | "rare" | "epic" | "legendary";
    
    conditionType: "challengeComplete" | "socialComplete" | "pointsThreshold" | "manual";
    conditionValue?: number; 
    conditionDifficulty?: "beginner" | "intermediate" | "advanced";
    isActive: boolean;
    created_at: Date;
    updated_at: Date;
}

const rewardSchema = new Schema<IReward>({
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    type: { 
        type: String, 
        enum: ["trophy", "medal", "item", "title"], 
        required: true 
    },
    iconUrl: { type: String, required: true },
    rarity: { 
        type: String, 
        enum: ["common", "rare", "epic", "legendary"], 
        default: "common" 
    },
    conditionType: { 
        type: String, 
        enum: ["challengeComplete", "socialComplete", "pointsThreshold", "manual"], 
        required: true 
    },
    conditionValue: { type: Number },
    conditionDifficulty: { 
        type: String, 
        enum: ["beginner", "intermediate", "advanced"] 
    },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    strict: true
});

rewardSchema.index({ conditionType: 1, isActive: 1 });
rewardSchema.index({ conditionDifficulty: 1 });

export const RewardModel = model<IReward>("Reward", rewardSchema);