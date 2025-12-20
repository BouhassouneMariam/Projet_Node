import { Schema, model, Document, Types } from "mongoose";

export interface ITrainingStat extends Document {
    user: Types.ObjectId;
    challenge: Types.ObjectId;
    sessionDate: Date;
    duration: number;
    caloriesBurned: number;
    notes?: string;
    completed: boolean;
    totalWeight?: number;  
    totalReps?: number;    
    totalDistance?: number; 
    totalSets?: number;     
    exercises: IExerciseEntry[];  
    created_at: Date;
    updated_at: Date;
}

export interface IExerciseEntry {
    exerciseType: Types.ObjectId;
    sets: number;
    reps: number;
    weight?: number;      
    distance?: number;    
    duration?: number;    
    notes?: string;
}

const exerciseEntrySchema = new Schema<IExerciseEntry>({
    exerciseType: { type: Schema.Types.ObjectId, ref: "ExerciseType", required: true },
    sets: { type: Number, required: true, min: 1 },
    reps: { type: Number, required: true, min: 0 },
    weight: { type: Number, min: 0 },
    distance: { type: Number, min: 0 },
    duration: { type: Number, min: 0 },
    notes: { type: String }
}, { _id: false });

const trainingStatSchema = new Schema<ITrainingStat>({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    challenge: { type: Schema.Types.ObjectId, ref: "Challenge", required: true },
    sessionDate: { type: Date, required: true },
    duration: { type: Number, required: true, min: 1 },
    caloriesBurned: { type: Number, required: true, min: 0 },
    notes: { type: String },
    completed: { type: Boolean, default: false },
    totalWeight: { type: Number, default: 0 },
    totalReps: { type: Number, default: 0 },
    totalDistance: { type: Number, default: 0 },
    totalSets: { type: Number, default: 0 },
    exercises: { type: [exerciseEntrySchema], default: [] }
}, {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    strict: true
});

trainingStatSchema.pre('save', function(next) {
    if (this.exercises && this.exercises.length > 0) {
        this.totalSets = this.exercises.reduce((sum, ex) => sum + ex.sets, 0);
        this.totalReps = this.exercises.reduce((sum, ex) => sum + (ex.sets * ex.reps), 0);
        this.totalWeight = this.exercises.reduce((sum, ex) => {
            if (ex.weight) {
                return sum + (ex.sets * ex.reps * ex.weight);
            }
            return sum;
        }, 0);
        this.totalDistance = this.exercises.reduce((sum, ex) => sum + (ex.distance || 0), 0);
    }
    next();
});

trainingStatSchema.index({ user: 1, sessionDate: -1 });
trainingStatSchema.index({ user: 1, completed: 1 });


export const TrainingStatModel = model<ITrainingStat>("TrainingStat", trainingStatSchema);