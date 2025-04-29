import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/artist/info?artistId=xxx
export async function GET(req: Request) {
  try {
    // Get artist ID from query
    const url = new URL(req.url);
    const artistId = url.searchParams.get("artistId");

    if (!artistId) {
      return NextResponse.json(
        { message: "Artist ID is required" },
        { status: 400 }
      );
    }

    // Find artist data
    const artist = await db.user.findUnique({
      where: {
        id: artistId,
        role: "ARTIST",
      },
      select: {
        id: true,
        name: true,
        image: true,
        yearsOfExperience: true,
        bio: true,
        instagram: true,
        facebook: true,
        twitter: true,
        tiktok: true,
        website: true,
      },
    });

    if (!artist) {
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

    if (artistMetadata?.artistSettings) {
      try {
        const settings = JSON.parse(artistMetadata.artistSettings);
        // Always use the fixed specialties
        certificates = settings.certificates || [];
        services = settings.services || [];

        // Filter out inactive services for public view
        services = services.filter((service) => service.isActive);
      } catch (error) {
        console.error("Error parsing artist settings:", error);
      }
    }

    // Get completed appointments count (for showing experience)
    const completedAppointments = await db.appointment.count({
      where: {
        artistId,
        status: "COMPLETED",
      },
    });

    // Get availability settings
    let workingHours = {
      start: 10,
      end: 24,
      interval: 30,
    };

    if (artistMetadata?.availabilitySettings) {
      try {
        const availabilitySettings = JSON.parse(
          artistMetadata.availabilitySettings
        );
        workingHours = availabilitySettings.workingHours || workingHours;
      } catch (error) {
        console.error("Error parsing availability settings:", error);
      }
    }

    // Return public artist data
    return NextResponse.json({
      ...artist,
      specialties,
      certificates,
      services,
      stats: {
        completedAppointments,
      },
      workingHours,
    });
  } catch (error) {
    console.error("Error fetching artist info:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
