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
  // User fields
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please provide a valid email address"),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  // MakeUpArtist fields
  bio: z
    .string()
    .max(1000, "Bio must be less than 1000 characters")
    .optional()
    .nullable(),
  experience_years: z.string().optional().nullable(),
  portfolio: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  pricing: z.number().min(0).optional().nullable(),
  availability: z.boolean().default(false).optional(),

  // Social media fields
  instagram_url: z
    .string()
    .url("Please enter a valid Instagram URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  facebook_url: z
    .string()
    .url("Please enter a valid Facebook URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  twitter_url: z
    .string()
    .url("Please enter a valid Twitter URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  tiktok_url: z
    .string()
    .url("Please enter a valid TikTok URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  youtube_url: z
    .string()
    .url("Please enter a valid YouTube URL")
    .optional()
    .nullable()
    .or(z.literal("")),

  // Services
  services: z.array(artistServiceSchema).optional().nullable().default([]),
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
export type ArtistSettingsFormValues = z.infer<typeof artistSettingsSchema>;
