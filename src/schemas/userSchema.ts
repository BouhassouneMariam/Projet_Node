import { z } from "zod";

export const createUserBody = z.object({
  firstname: z.string().min(1, "firstname requis"),
  lastname: z.string()
    .min(1, "lastname requis")
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ'\-\s]+$/, "Pas de chiffres dans lastname"),
  email: z.email("email invalide"),
  password: z.string().min(8, "mot de passe trop court"),
  role: z.enum(["admin", "manager", "member"]),
  active: z.boolean().optional().default(true),
});

export const updateUserBody = createUserBody
  .partial()
  .refine(obj => Object.keys(obj).length > 0, { message: "Au moins un champ est requis" });

export const authUserBody = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export type CreateUserInput = z.infer<typeof createUserBody>;
export type UpdateUserInput = z.infer<typeof updateUserBody>;
export type AuthUserInput = z.infer<typeof authUserBody>;