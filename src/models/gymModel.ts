import { Schema, model, Document, Types } from "mongoose";

export interface IGym extends Document {
  name: string;
  address: string;
  capacity: number;
  equipment: string[];
  facilities: string[];
  owner: Types.ObjectId;
  approved: boolean;
  description?: string;
  phone?: string;
  email?: string;
  exerciseTypes: Types.ObjectId[];
  difficultyLevels: string[];
  created_at: Date;
  updated_at: Date;
}

const gymSchema = new Schema<IGym>({
  name: { type: String, required: true },
  address: { type: String, required: true },
  capacity: { type: Number, required: true, min: 1 },
  equipment: { type: [String], default: [] },
  facilities: { type: [String], default: [] },
  owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  approved: { type: Boolean, default: false },
  description: { type: String },
  phone: { type: String },
  email: { type: String },
  exerciseTypes: [{ type: Schema.Types.ObjectId, ref: "ExerciseType" }],

  difficultyLevels: { type: [String], default: [] }
}, {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  strict: true
});

export const GymModel = model<IGym>("Gym", gymSchema);
