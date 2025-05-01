import { z } from "zod";

// Basic schema for artist settings service validation
export const artistServiceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Service name must be at least 2 characters"),
  description: z.string().optional().nullable(),
  price: z
    .number()
    .min(0, "Price cannot be negative")
    .optional()
    .nullable()
    .default(0),
  isActive: z.boolean().default(true).optional().nullable(),
});

// Schema for artist settings validation
export const artistSettingsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please provide a valid email address"),
  yearsOfExperience: z.number().min(0).optional().nullable(),
  bio: z
    .string()
    .max(1000, "Bio must be less than 1000 characters")
    .optional()
    .nullable(),
  instagram: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  tiktok: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  defaultPrice: z.number().min(0).optional().nullable(),
  certificates: z.array(z.string()).optional().nullable().default([]),
  services: z.array(artistServiceSchema).optional().nullable().default([]),
  specialties: z.array(z.string()).optional().nullable().default([]),
});

// Schema for password update validation
export const passwordUpdateSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type PasswordUpdateFormValues = z.infer<typeof passwordUpdateSchema>;
