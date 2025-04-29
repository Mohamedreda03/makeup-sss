import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    // Build filter conditions
    const where: any = {
      role: "ARTIST",
    };

    // Add category filter if provided
    if (category && category !== "all") {
      where.category = category;
    }

    // Get artists with metadata
    const artists = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        category: true,
        metadata: {
          select: {
            availabilitySettings: true,
          },
        },
        // Count the number of completed appointments for each artist
        _count: {
          select: {
            artistAppointments: {
              where: {
                status: "COMPLETED",
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Process artists to determine availability
    const processedArtists = artists.map((artist: (typeof artists)[0]) => {
      // Check availability from metadata
      let isAvailable = true;

      if (artist.metadata?.availabilitySettings) {
        try {
          const settings = JSON.parse(artist.metadata.availabilitySettings);
          if (settings.isAvailable !== undefined) {
            isAvailable = settings.isAvailable;
          }
        } catch (error) {
          console.error("Error parsing availability settings:", error);
        }
      }

      return {
        id: artist.id,
        name: artist.name,
        image: artist.image,
        category: artist.category || "",
        completedAppointments: artist._count.artistAppointments,
        isAvailable,
      };
    });

    return NextResponse.json({ artists: processedArtists });
  } catch (error) {
    console.error("Error fetching artists:", error);
    return NextResponse.json(
      { message: "Error fetching artists" },
      { status: 500 }
    );
  }
}
