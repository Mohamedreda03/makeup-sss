import { NextResponse } from "next/server";
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

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    const { status } = await req.json();

    // Verify session and permissions
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const user = session.user as ExtendedUser;
    const userRole = user.role || "CUSTOMER";

    // Only admins and artists can update booking status
    if (userRole !== "ADMIN" && userRole !== "ARTIST") {
      return NextResponse.json(
        {
          message: "Forbidden - You are not allowed to modify booking status",
        },
        { status: 403 }
      );
    }

    // Check if booking exists
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        artist: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phone: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { message: "Booking not found" },
        { status: 404 }
      );
    }

    // For artists, verify they own this booking
    if (userRole === "ARTIST") {
      const makeupArtist = await db.makeUpArtist.findUnique({
        where: { user_id: user.id },
      });

      if (!makeupArtist || booking.artist_id !== makeupArtist.id) {
        return NextResponse.json(
          { message: "Forbidden - You can only update your own bookings" },
          { status: 403 }
        );
      }
    }

    // Validate status
    const validStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { message: "Invalid status value" },
        { status: 400 }
      );
    }

    // Update the booking status
    const updatedBooking = await db.booking.update({
      where: { id: bookingId },
      data: {
        booking_status: status,
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
      },
    });
    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error("Error updating booking status:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
