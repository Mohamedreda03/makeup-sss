import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get artist ID from params
    const artistId = params.id;

    // Fetch artist data including default price
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
        instagram: true,
        facebook: true,
        twitter: true,
        tiktok: true,
        website: true,
        bio: true,
        yearsOfExperience: true,
        defaultPrice: true,
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
