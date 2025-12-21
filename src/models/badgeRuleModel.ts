import { Schema, model, Document } from "mongoose";

export interface IBadgeRule extends Document {
    badgeName: string;
    conditionType: "totalPoints" | "completedTrainings" | "custom";
    conditionField: string;
    operator: ">=" | ">" | "=" | "<" | "<=";
    value: number;
    customCondition?: string;
    isActive: boolean;
    created_at: Date;
    updated_at: Date;
}

const badgeRuleSchema = new Schema<IBadgeRule>({
    badgeName: { type: String, required: true },
    conditionType: { 
        type: String, 
        required: true, 
        enum: ["totalPoints", "completedTrainings", "custom"],
        default: "totalPoints"
    },
    conditionField: { type: String, required: true },
    operator: { 
        type: String, 
        required: true, 
        enum: [">=", ">", "=", "<", "<="],
        default: ">="
    },
    value: { type: Number, required: true },
    customCondition: { type: String },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    strict: true
});

badgeRuleSchema.index({ badgeName: 1 });
badgeRuleSchema.index({ isActive: 1 });

export const BadgeRuleModel = model<IBadgeRule>("BadgeRule", badgeRuleSchema);
