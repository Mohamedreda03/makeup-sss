import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Extended user interface
interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

// PUT /api/admin/appointments/[id]/status
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify user is authenticated and is an admin
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const user = session.user as ExtendedUser;

    // Check if user is an admin
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Get booking ID from URL params
    const bookingId = params.id; // Check if booking exists
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        artist: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { message: "Booking not found" },
        { status: 404 }
      );
    }

    // Get status from request body
    const { status } = await req.json();

    // Validate status
    const validStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { message: "Invalid status value" },
        { status: 400 }
      );
    }

    // Update booking status
    const updatedBooking = await db.booking.update({
      where: { id: bookingId },
      data: {
        booking_status: status,
      },
    });

    // If booking is completed and has a price, update artist earnings
    if (
      status === "COMPLETED" &&
      booking.total_price &&
      booking.total_price > 0
    ) {
      try {
        await db.makeUpArtist.update({
          where: { id: booking.artist_id },
          data: {
            earnings: {
              increment: booking.total_price,
            },
          },
        });
        console.log(
          `Updated artist ${booking.artist_id} earnings by ${booking.total_price}`
        );
      } catch (earningsError) {
        console.error("Error updating artist earnings:", earningsError);
        // Don't fail the main operation if earnings update fails
      }
    }

    return NextResponse.json({
      message: "Booking status updated successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    return NextResponse.json(
      { message: "Server error", error: String(error) },
      { status: 500 }
    );
  }
}
