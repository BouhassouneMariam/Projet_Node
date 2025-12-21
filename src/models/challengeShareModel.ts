import { Schema, model, Document, Types } from "mongoose";

export interface IChallengeShare extends Document {
    challenge: Types.ObjectId;
    sharedBy: Types.ObjectId;
    sharedWith: Types.ObjectId;
    message?: string;
    seen: boolean;
    created_at: Date;
    updated_at: Date;
}

const challengeShareSchema = new Schema<IChallengeShare>({
    challenge: { type: Schema.Types.ObjectId, ref: "Challenge", required: true },
    sharedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sharedWith: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String },
    seen: { type: Boolean, default: false }
}, {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    strict: true
});


challengeShareSchema.index({ sharedWith: 1, seen: 1 });

challengeShareSchema.index({ challenge: 1, sharedBy: 1, sharedWith: 1 }, { unique: true });

export const ChallengeShareModel = model<IChallengeShare>("ChallengeShare", challengeShareSchema);