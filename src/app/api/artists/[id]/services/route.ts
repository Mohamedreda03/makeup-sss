import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get artist ID from params
    const artistId = params.id;

    // Fetch artist's services
    const services = await db.artistService.findMany({
      where: {
        artistId,
        isActive: true, // Only return active services
      },
      orderBy: {
        price: "asc", // Sort by price from low to high
      },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error("Error fetching artist services:", error);
    return NextResponse.json(
      { message: "Error fetching artist services" },
      { status: 500 }
    );
  }
}
