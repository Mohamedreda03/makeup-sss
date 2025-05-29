import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. You must be signed in." },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        makeup_artist: true,
      },
    });

    if (!user || user.role !== "ARTIST" || !user.makeup_artist) {
      return NextResponse.json(
        { error: "Unauthorized. Only artists can access this data." },
        { status: 403 }
      );
    }

    const { amount } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount. Amount must be greater than 0." },
        { status: 400 }
      );
    }

    // Update artist earnings
    const updatedArtist = await db.makeUpArtist.update({
      where: { id: user.makeup_artist.id },
      data: {
        earnings: {
          increment: amount,
        },
      },
    });

    return NextResponse.json({
      message: "Earnings updated successfully",
      earnings: updatedArtist.earnings,
    });
  } catch (error) {
    console.error("Error updating artist earnings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. You must be signed in." },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        makeup_artist: true,
      },
    });

    if (!user || user.role !== "ARTIST" || !user.makeup_artist) {
      return NextResponse.json(
        { error: "Unauthorized. Only artists can access this data." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      earnings: user.makeup_artist.earnings,
    });
  } catch (error) {
    console.error("Error fetching artist earnings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
