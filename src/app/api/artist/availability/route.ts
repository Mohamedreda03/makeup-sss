import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { toEgyptTime, formatInEgypt } from "@/lib/timezone-config";

export const dynamic = "force-dynamic";

// Schema for availability settings validation
const availabilitySettingsSchema = z.object({
  workingDays: z.array(z.number().min(0).max(6)), // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: z.string(), // HH:MM format
  endTime: z.string(), // HH:MM format
  sessionDuration: z.number().min(15).max(480), // Duration in minutes (15min - 8hours)
  breakBetweenSessions: z.number().min(0).max(120).default(15), // Break in minutes
  isAvailable: z.boolean().default(true),
});

// GET - Fetch artist's available slots
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } // Find the makeup artist
    const artist = await db.makeUpArtist.findUnique({
      where: { user_id: session.user.id },
      select: {
        id: true,
        available_slots: true,
        availability: true,
      },
    });

    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    // Parse the stored availability settings
    let availabilitySettings = null;
    if (artist.available_slots) {
      try {
        availabilitySettings =
          typeof artist.available_slots === "string"
            ? JSON.parse(artist.available_slots)
            : artist.available_slots;
      } catch (e) {
        console.error("Error parsing availability settings:", e);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        availabilitySettings: availabilitySettings || {
          workingDays: [],
          startTime: "09:00",
          endTime: "17:00",
          sessionDuration: 60,
          breakBetweenSessions: 15,
          isAvailable: true,
        },
        generalAvailability: artist.availability,
      },
    });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update artist's available slots
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const validation = availabilitySettingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid data",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const availabilitySettings = validation.data;

    // Find and verify the makeup artist belongs to the current user
    const artist = await db.makeUpArtist.findUnique({
      where: { user_id: session.user.id },
    });

    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    // Update the availability settings
    const updatedArtist = await db.makeUpArtist.update({
      where: { user_id: session.user.id },
      data: {
        available_slots: availabilitySettings,
        // Set general availability based on working days
        availability:
          availabilitySettings.isAvailable &&
          availabilitySettings.workingDays.length > 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Availability settings updated successfully",
      data: {
        availabilitySettings: updatedArtist.available_slots,
        generalAvailability: updatedArtist.availability,
      },
    });
  } catch (error) {
    console.error("Error updating availability:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
