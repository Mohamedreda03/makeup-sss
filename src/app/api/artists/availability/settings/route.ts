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
    } // Find artist metadata with availability settings
    const makeupArtist = await db.makeUpArtist.findUnique({
      where: {
        user_id: artistId,
      },
    });

    // If no settings exist yet, return default values
    if (!makeupArtist || !makeupArtist.available_slots) {
      return NextResponse.json({
        isAvailable: true, // Default to available
        workingHours: {
          start: 10, // 10 AM
          end: 24, // 12 AM (midnight)
          interval: 30, // 30 minute intervals
        },
        regularDaysOff: [0, 6], // Sunday and Saturday off by default
      });
    } // Return the stored settings
    return NextResponse.json(makeupArtist.available_slots);
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
    const validatedData = availabilitySettingsSchema.parse(requestBody); // Update or create the artist's metadata with availability settings
    const updatedMakeupArtist = await db.makeUpArtist.upsert({
      where: {
        user_id: artistId,
      },
      update: {
        available_slots: validatedData,
      },
      create: {
        user_id: artistId,
        available_slots: validatedData,
      },
    });
    return NextResponse.json({
      message: "Availability settings updated successfully",
      data: updatedMakeupArtist.available_slots,
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
