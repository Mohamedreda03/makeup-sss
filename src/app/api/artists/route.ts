import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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
    }

    // Get artists
    const artists = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        yearsOfExperience: true,
        defaultPrice: true,
        instagram: true,
        facebook: true,
        twitter: true,
        tiktok: true,
        website: true,
        // Get metadata for availability
        metadata: {
          select: {
            availabilitySettings: true,
            artistSettings: true,
          },
        },
        // Get total appointments
        _count: {
          select: {
            artistAppointments: true,
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
    });

    // Process artists data
    const processedArtists = artists.map((artist) => {
      // Calculate rating
      const totalRatings = artist.reviews.length;
      const averageRating =
        totalRatings > 0
          ? artist.reviews.reduce((sum, review) => sum + review.rating, 0) /
            totalRatings
          : 0;

      // Check availability
      let isAvailable = true;
      if (artist.metadata?.availabilitySettings) {
        try {
          const settings = JSON.parse(artist.metadata.availabilitySettings);
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
        bio: artist.bio || "",
        yearsOfExperience: artist.yearsOfExperience || 0,
        defaultPrice: artist.defaultPrice || 0,
        totalAppointments: artist._count.artistAppointments,
        rating: averageRating,
        totalReviews: totalRatings,
        social: {
          instagram: artist.instagram,
          facebook: artist.facebook,
          twitter: artist.twitter,
          tiktok: artist.tiktok,
          website: artist.website,
        },
        isAvailable,
      };
    });

    return Response.json(processedArtists);
  } catch (error) {
    console.error("Error fetching artists:", error);
    return Response.json({ error: "Failed to fetch artists" }, { status: 500 });
  }
}
