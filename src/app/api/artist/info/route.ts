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
    } // Find artist data
    const artist = await db.user.findUnique({
      where: {
        id: artistId,
        role: "ARTIST",
      },
      select: {
        id: true,
        name: true,
        image: true,
        phone: true,
        address: true,
        makeup_artist: {
          select: {
            id: true,
            bio: true,
            experience_years: true,
            pricing: true,
            rating: true,
            availability: true,
            portfolio: true,
            gender: true,
            available_slots: true,
            earnings: true,
          },
        },
      },
    });
    if (!artist) {
      return NextResponse.json(
        { message: "Artist not found" },
        { status: 404 }
      );
    }

    // Get artist services from database
    const artistServices = await db.artistService.findMany({
      where: {
        artistId,
        isActive: true,
      },
      orderBy: {
        price: "asc",
      },
    });

    // Default specialties (these are standard for makeup artists)
    const specialties: string[] = [
      "Bridal Makeup",
      "Party Makeup",
      "Editorial & Photoshoot",
      "Henna Night & Engagement",
      "Bridal & Reception",
      "Photoshoot Makeup",
      "Runway & Fashion Show",
    ];

    // Format services for response
    const services = artistServices.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description || "",
      price: service.price,
      duration: service.duration || 60,
      isActive: service.isActive,
    })); // Get completed bookings count (for showing experience)
    // First get the makeup artist record
    const makeupArtist = await db.makeUpArtist.findUnique({
      where: { user_id: artistId },
    });

    const completedBookings = makeupArtist
      ? await db.booking.count({
          where: {
            artist_id: makeupArtist.id,
            booking_status: "COMPLETED",
          },
        })
      : 0;

    // Get availability settings from makeup_artist profile
    let workingHours = {
      start: 10,
      end: 24,
      interval: 30,
    };

    if (artist.makeup_artist?.available_slots) {
      try {
        const availabilitySettings =
          typeof artist.makeup_artist.available_slots === "string"
            ? JSON.parse(artist.makeup_artist.available_slots)
            : artist.makeup_artist.available_slots;

        if (availabilitySettings.startTime && availabilitySettings.endTime) {
          workingHours = {
            start: parseInt(availabilitySettings.startTime.split(":")[0]),
            end: parseInt(availabilitySettings.endTime.split(":")[0]),
            interval: availabilitySettings.sessionDuration || 30,
          };
        }
      } catch (error) {
        console.error("Error parsing availability settings:", error);
      }
    }

    // Return public artist data
    return NextResponse.json({
      id: artist.id,
      name: artist.name,
      image: artist.image,
      phone: artist.phone,
      address: artist.address,
      bio: artist.makeup_artist?.bio || "",
      yearsOfExperience: artist.makeup_artist?.experience_years || 0,
      specialties,
      certificates: [], // Could be added to schema later if needed
      services,
      stats: {
        completedAppointments: completedBookings,
      },
      workingHours,
    });
  } catch (error) {
    console.error("Error fetching artist info:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
