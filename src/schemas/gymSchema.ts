import { z } from "zod";

const locationSchema = z.object({
    type: z.literal("Point").default("Point"),
    coordinates: z.tuple([
        z.number().min(-180).max(180),  
        z.number().min(-90).max(90)     
    ])
}).optional();

export const createGymBody = z.object({
    name: z.string().min(1, "Le nom est requis"),
    address: z.string().min(1, "L'adresse est requise"),
    capacity: z.number().int().min(1, "La capacité doit être au moins 1"),
    equipment: z.array(z.string()).optional().default([]),
    facilities: z.array(z.string()).optional().default([]),
    owner: z.string().min(1, "L'ID du propriétaire est requis"),
    description: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Email invalide").optional(),
    exerciseTypes: z.array(
        z.string().regex(/^[0-9a-fA-F]{24}$/, "ID d'exercice invalide")
    ).optional().default([]),
    location: locationSchema,
    city: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional().default("France")
});


export const updateGymBody = createGymBody
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Au moins un champ est requis",
  });

export const approveGymBody = z.object({
  approved: z.boolean(),
});

export const exerciseTypesBody = z.object({
  exerciseTypes: z.array(z.string()),
});

export const nearbySearchBody = z.object({
    longitude: z.number().min(-180).max(180),
    latitude: z.number().min(-90).max(90),
    maxDistance: z.number().min(100).max(50000).default(5000), 
});

export type CreateGymInput = z.infer<typeof createGymBody>;
export type UpdateGymInput = z.infer<typeof updateGymBody>;
export type ExerciseTypesInput = z.infer<typeof exerciseTypesBody>;
export type NearbySearchInput = z.infer<typeof nearbySearchBody>;