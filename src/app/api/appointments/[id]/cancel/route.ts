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
    const appointmentId = params.id;

    // Verify user session
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const user = session.user as ExtendedUser;
    const userId = user.id;
    const userRole = user.role || "CUSTOMER"; // Check if booking exists
    const booking = await db.booking.findUnique({
      where: { id: appointmentId },
    });

    if (!booking) {
      return NextResponse.json(
        { message: "Booking not found" },
        { status: 404 }
      );
    }

    // Verify permissions: users can only cancel their own bookings, while admins can cancel any booking
    if (booking.user_id !== userId && userRole !== "ADMIN") {
      return NextResponse.json(
        {
          message: "Forbidden - You are not allowed to cancel this booking",
        },
        { status: 403 }
      );
    }

    // Check if booking is already cancelled or completed
    if (booking.booking_status === "CANCELLED") {
      return NextResponse.json(
        { message: "Booking already cancelled" },
        { status: 400 }
      );
    }

    if (booking.booking_status === "COMPLETED") {
      return NextResponse.json(
        {
          message: "Cannot cancel completed booking",
        },
        { status: 400 }
      );
    }

    // Update booking status to "CANCELLED"
    const updatedBooking = await db.booking.update({
      where: { id: appointmentId },
      data: { booking_status: "CANCELLED" },
    });
    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
