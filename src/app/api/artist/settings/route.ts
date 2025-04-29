import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Extended user interface
interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

// Artist service schema
const serviceSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Service name is required"),
  description: z.string(),
  price: z.number().min(0, "Price must be a positive number"),
  duration: z.number().min(15, "Duration must be at least 15 minutes"),
  isActive: z.boolean(),
});

// Main schema for validation
const artistSettingsSchema = z.object({
  yearsOfExperience: z.number().min(0).max(100).optional(),
  bio: z.string().max(1000).optional(),
  instagram: z.string().max(100).optional(),
  facebook: z.string().max(100).optional(),
  twitter: z.string().max(100).optional(),
  tiktok: z.string().max(100).optional(),
  website: z.string().url().max(100).optional().or(z.literal("")),
  defaultPrice: z.number().min(0).optional().nullable(),
  specialties: z.array(z.string()).optional(),
  certificates: z.array(z.string()).optional(),
  services: z.array(serviceSchema).optional(),
  category: z.string().optional(),
});

// GET /api/artist/settings
export async function GET(req: Request) {
  try {
    // Verify user is authenticated
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const user = session.user as ExtendedUser;

    // Verify that the user is an artist
    if (user.role !== "ARTIST" && user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden - Access denied" },
        { status: 403 }
      );
    }

    // Get artist ID (for admins viewing another artist)
    const url = new URL(req.url);
    let artistId = user.id;

    if (user.role === "ADMIN" && url.searchParams.get("artistId")) {
      artistId = url.searchParams.get("artistId") as string;
    }

    // Find artist data
    const artistData = await db.user.findUnique({
      where: {
        id: artistId,
        role: "ARTIST",
      },
      select: {
        id: true,
        yearsOfExperience: true,
        bio: true,
        instagram: true,
        facebook: true,
        twitter: true,
        tiktok: true,
        website: true,
        defaultPrice: true,
      },
    });

    if (!artistData) {
      return NextResponse.json(
        { message: "Artist not found" },
        { status: 404 }
      );
    }

    // Find artist metadata (for specialties, certificates, and services)
    const artistMetadata = await db.userMetadata.findUnique({
      where: {
        userId: artistId,
      },
    });

    // Parse metadata or use defaults
    let specialties: string[] = [
      "Bridal Makeup",
      "Party Makeup",
      "Editorial & Photoshoot",
      "Henna Night & Engagement",
      "Bridal & Reception",
      "Photoshoot Makeup",
      "Runway & Fashion Show",
    ];
    let certificates: string[] = [];
    let services: any[] = [];
    let category: string = "";

    if (artistMetadata?.artistSettings) {
      try {
        const settings = JSON.parse(artistMetadata.artistSettings);
        // Use fixed specialties
        certificates = settings.certificates || [];
        services = settings.services || [];
        category = settings.category || "";
      } catch (error) {
        console.error("Error parsing artist settings:", error);
      }
    }

    // Return combined data
    return NextResponse.json({
      ...artistData,
      specialties,
      certificates,
      services,
      category,
    });
  } catch (error) {
    console.error("Error fetching artist settings:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// PUT /api/artist/settings
export async function PUT(req: Request) {
  try {
    // Verify user is authenticated
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const user = session.user as ExtendedUser;

    // Verify that the user is an artist
    if (user.role !== "ARTIST" && user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden - Access denied" },
        { status: 403 }
      );
    }

    // Get artist ID (for admins updating another artist)
    const url = new URL(req.url);
    let artistId = user.id;

    if (user.role === "ADMIN" && url.searchParams.get("artistId")) {
      artistId = url.searchParams.get("artistId") as string;
    }

    console.log("Processing request for artistId:", artistId);

    // Parse and validate request body
    const requestBody = await req.json();
    console.log("Request body received:", requestBody);

    const validatedData = artistSettingsSchema.parse(requestBody);
    console.log("Validated data:", validatedData);

    // Extract data for the user table
    const {
      yearsOfExperience,
      bio,
      instagram,
      facebook,
      twitter,
      tiktok,
      website,
      defaultPrice,
    } = validatedData;

    // Extract data for the metadata
    const { certificates, services } = validatedData;

    console.log("Category from request:", validatedData.category);

    // Use fixed specialties
    const specialties = [
      "Bridal Makeup",
      "Party Makeup",
      "Editorial & Photoshoot",
      "Henna Night & Engagement",
      "Bridal & Reception",
      "Photoshoot Makeup",
      "Runway & Fashion Show",
    ];

    // Update user record
    await db.user.update({
      where: {
        id: artistId,
      },
      data: {
        yearsOfExperience,
        bio,
        instagram,
        facebook,
        twitter,
        tiktok,
        website,
        defaultPrice,
        category: validatedData.category || null,
      },
    });

    // Prepare artist settings object for better logging
    const artistSettingsObj = {
      specialties,
      certificates,
      services,
      category: validatedData.category || "",
    };

    console.log(
      "Saving artist settings:",
      JSON.stringify(artistSettingsObj, null, 2)
    );

    // Update or create metadata with artist settings
    const updatedMetadata = await db.userMetadata.upsert({
      where: {
        userId: artistId,
      },
      update: {
        artistSettings: JSON.stringify(artistSettingsObj),
      },
      create: {
        userId: artistId,
        artistSettings: JSON.stringify(artistSettingsObj),
      },
    });

    console.log("UserMetadata updated successfully, id:", updatedMetadata.id);

    return NextResponse.json({
      message: "Artist settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating artist settings:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data format", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
