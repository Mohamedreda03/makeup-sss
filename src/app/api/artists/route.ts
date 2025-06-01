import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    // Build filter conditions
    const where: any = {
      role: "ARTIST",
    };

    // Add name filter if provided
    if (name) {
      where.name = {
        contains: name,
        mode: "insensitive",
      };
    } // Get artists
    const artists = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
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
        // Get total bookings
        _count: {
          select: {
            bookings: true,
          },
        },
        // Get ratings
        reviews: {
          where: {
            status: "APPROVED",
          },
          select: {
            rating: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }); // Process artists data
    const processedArtists = artists.map((artist) => {
      // Calculate rating
      const totalRatings = artist.reviews.length;
      const averageRating =
        totalRatings > 0
          ? artist.reviews.reduce((sum, review) => sum + review.rating, 0) /
            totalRatings
          : 0;

      // Check availability from makeup_artist profile
      let isAvailable = artist.makeup_artist?.availability || false;
      if (artist.makeup_artist?.available_slots) {
        try {
          const settings =
            typeof artist.makeup_artist.available_slots === "string"
              ? JSON.parse(artist.makeup_artist.available_slots)
              : artist.makeup_artist.available_slots;
          if (typeof settings.isAvailable !== "undefined") {
            isAvailable = settings.isAvailable;
          }
        } catch (error) {
          console.error("Error parsing availability settings:", error);
        }
      }

      // Format response
      return {
        id: artist.id,
        name: artist.name,
        image: artist.image,
        bio: artist.makeup_artist?.bio || "",
        yearsOfExperience: artist.makeup_artist?.experience_years || 0,
        defaultPrice: artist.makeup_artist?.pricing || 0,
        totalAppointments: artist._count.bookings,
        rating: averageRating,
        totalReviews: totalRatings,
        phone: artist.phone,
        address: artist.address,
        isAvailable,
      };
    });

    return Response.json(processedArtists);
  } catch (error) {
    console.error("Error fetching artists:", error);
    return Response.json({ error: "Failed to fetch artists" }, { status: 500 });
  }
}
