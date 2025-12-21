import { Schema, model, Document } from "mongoose";

export interface IBadge extends Document {
    name: string;
    description: string;
    iconUrl: string;
    created_at: Date;
    updated_at: Date;
}

const badgeSchema = new Schema<IBadge>({
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    iconUrl: { type: String, required: true },
}, {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    strict: true
});

export const BadgeModel = model<IBadge>("Badge", badgeSchema);