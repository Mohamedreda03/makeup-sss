import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { BookingStatus } from "@/generated/prisma";

// Extended user interface
interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

// GET booking details
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify user is authenticated
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const user = session.user as ExtendedUser;
    const bookingId = params.id;

    // Fetch booking
    const booking = await db.booking.findUnique({
      where: {
        id: bookingId,
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
        artist: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
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

    // Check if user has access to this booking
    const isOwner = booking.user_id === user.id;
    const isArtist =
      user.role === "ARTIST" && booking.artist.user_id === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!isOwner && !isArtist && !isAdmin) {
      return NextResponse.json(
        { message: "Forbidden - Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
} // Update booking details
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    const requestData = await req.json();
    const { status } = requestData;

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

    // Only admins and artists can update bookings
    if (userRole !== "ADMIN" && userRole !== "ARTIST") {
      return NextResponse.json(
        {
          message: "Forbidden - You are not allowed to modify bookings",
        },
        { status: 403 }
      );
    }

    // Check if booking exists
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
    } // Prepare update data
    const updateData: { booking_status?: BookingStatus } = {};

    if (status) {
      const validStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { message: "Invalid status value" },
          { status: 400 }
        );
      }
      updateData.booking_status = status as BookingStatus;
    }

    // Update the booking
    const updatedBooking = await db.booking.update({
      where: { id: bookingId },
      data: updateData,
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
        artist: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
