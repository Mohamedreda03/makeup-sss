import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get artist ID from params
    const artistId = params.id; // Fetch artist data including makeup artist profile
    const artist = await db.user.findUnique({
      where: {
        id: artistId,
        role: "ARTIST",
      },
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
      },
    });

    if (!artist) {
      return NextResponse.json(
        { message: "Artist not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(artist);
  } catch (error) {
    console.error("Error fetching artist info:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
