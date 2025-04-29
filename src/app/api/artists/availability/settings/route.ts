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

// Validation schema for availability settings
const availabilitySettingsSchema = z.object({
  isAvailable: z.boolean(), // Whether the artist is available for booking
  workingHours: z.object({
    start: z.number().min(0).max(23), // 0-23 hours
    end: z.number().min(0).max(24), // 0-24 hours (24 = midnight of next day)
    interval: z.number().min(15).max(120), // 15-120 minutes
  }),
  regularDaysOff: z.array(z.number().min(0).max(6)), // 0 = Sunday, 6 = Saturday
});

// GET /api/artists/availability/settings
export async function GET(req: Request) {
  try {
    // Verify session and permissions
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const user = session.user as ExtendedUser;

    // Verify user is an artist or admin
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

    // Find artist metadata with availability settings
    const artistMetadata = await db.userMetadata.findUnique({
      where: {
        userId: artistId,
      },
    });

    // If no settings exist yet, return default values
    if (!artistMetadata || !artistMetadata.availabilitySettings) {
      return NextResponse.json({
        isAvailable: true, // Default to available
        workingHours: {
          start: 10, // 10 AM
          end: 24, // 12 AM (midnight)
          interval: 30, // 30 minute intervals
        },
        regularDaysOff: [0, 6], // Sunday and Saturday off by default
      });
    }

    // Return the stored settings
    return NextResponse.json(JSON.parse(artistMetadata.availabilitySettings));
  } catch (error) {
    console.error("Error fetching artist availability settings:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// POST /api/artists/availability/settings
export async function POST(req: Request) {
  try {
    // Verify session and permissions
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const user = session.user as ExtendedUser;

    // Verify user is an artist or admin
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

    // Parse and validate the request body
    const requestBody = await req.json();
    const validatedData = availabilitySettingsSchema.parse(requestBody);

    // Update or create the artist's metadata with availability settings
    const updatedMetadata = await db.userMetadata.upsert({
      where: {
        userId: artistId,
      },
      update: {
        availabilitySettings: JSON.stringify(validatedData),
      },
      create: {
        userId: artistId,
        availabilitySettings: JSON.stringify(validatedData),
      },
    });

    return NextResponse.json({
      message: "Availability settings updated successfully",
      data: updatedMetadata.availabilitySettings
        ? JSON.parse(updatedMetadata.availabilitySettings)
        : null,
    });
  } catch (error) {
    console.error("Error updating artist availability settings:", error);

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
