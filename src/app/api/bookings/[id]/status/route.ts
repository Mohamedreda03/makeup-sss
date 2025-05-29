import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { BookingStatus } from "@/generated/prisma";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
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

    const { status: newStatus, notes } = await req.json();

    if (!Object.values(BookingStatus).includes(newStatus)) {
      return NextResponse.json(
        { error: "Invalid booking status." },
        { status: 400 }
      );
    }

    // Find the booking and verify it belongs to this artist
    const booking = await db.booking.findFirst({
      where: {
        id: params.id,
        artist_id: user.makeup_artist.id,
      },
      include: {
        user: true,
        artist: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        {
          error: "Booking not found or you don't have permission to modify it.",
        },
        { status: 404 }
      );
    }

    // Start a transaction to update booking status and artist earnings
    const result = await db.$transaction(async (prisma) => {
      // Update booking status
      const updatedBooking = await prisma.booking.update({
        where: { id: params.id },
        data: {
          booking_status: newStatus,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              phone: true,
            },
          },
          artist: true,
        },
      });

      // If booking is completed and has a price, update artist earnings
      if (
        newStatus === "COMPLETED" &&
        booking.service_price &&
        booking.booking_status !== "COMPLETED"
      ) {
        await prisma.makeUpArtist.update({
          where: { id: user.makeup_artist!.id },
          data: {
            earnings: {
              increment: booking.service_price,
            },
          },
        });
      }

      // If booking was completed and is now being changed to another status, subtract from earnings
      if (
        booking.booking_status === "COMPLETED" &&
        newStatus !== "COMPLETED" &&
        booking.service_price
      ) {
        await prisma.makeUpArtist.update({
          where: { id: user.makeup_artist!.id },
          data: {
            earnings: {
              decrement: booking.service_price,
            },
          },
        });
      }

      return updatedBooking;
    });

    return NextResponse.json({
      message: "Booking status updated successfully",
      booking: result,
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
