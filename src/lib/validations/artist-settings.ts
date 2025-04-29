import { z } from "zod";

// Basic schema for artist settings service validation
export const artistServiceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Service name must be at least 2 characters"),
  description: z.string().optional(),
  price: z.number().min(0, "Price cannot be negative").optional(),
  duration: z.number().min(0, "Duration cannot be negative").optional(),
});

// Schema for artist settings validation
export const artistSettingsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please provide a valid email address"),
  yearsOfExperience: z.number().min(0).optional().nullable(),
  bio: z.string().max(1000, "Bio must be less than 1000 characters").optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  twitter: z.string().optional(),
  tiktok: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  defaultPrice: z.number().min(0).optional().nullable(),
  category: z.string().optional(),
  certificates: z.array(z.string()).optional(),
  services: z.array(artistServiceSchema).optional(),
  specialties: z.array(z.string()).optional(),
});
