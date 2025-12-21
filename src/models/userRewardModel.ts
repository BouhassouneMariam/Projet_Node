import { Schema, model, Document, Types } from "mongoose";

export interface IUserReward extends Document {
    user: Types.ObjectId;
    reward: Types.ObjectId;
    earnedAt: Date;
    sourceType: "challenge" | "socialChallenge" | "points" | "manual";
    sourceId?: Types.ObjectId; 
    created_at: Date;
    updated_at: Date;
}

const userRewardSchema = new Schema<IUserReward>({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reward: { type: Schema.Types.ObjectId, ref: "Reward", required: true },
    earnedAt: { type: Date, default: Date.now },
    sourceType: { 
        type: String, 
        enum: ["challenge", "socialChallenge", "points", "manual"], 
        required: true 
    },
    sourceId: { type: Schema.Types.ObjectId }
}, {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    strict: true
});


userRewardSchema.index({ user: 1 });

userRewardSchema.index({ user: 1, reward: 1, sourceId: 1 }, { unique: true, sparse: true });

export const UserRewardModel = model<IUserReward>("UserReward", userRewardSchema);