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
    const userRole = user.role || "CUSTOMER";

    // Check if appointment exists
    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return NextResponse.json(
        { message: "Appointment not found" },
        { status: 404 }
      );
    }

    // Verify permissions: users can only cancel their own appointments, while admins can cancel any appointment
    if (appointment.userId !== userId && userRole !== "ADMIN") {
      return NextResponse.json(
        {
          message: "Forbidden - You are not allowed to cancel this appointment",
        },
        { status: 403 }
      );
    }

    // Check if appointment is already cancelled or completed
    if (appointment.status === "CANCELLED") {
      return NextResponse.json(
        { message: "Appointment already cancelled" },
        { status: 400 }
      );
    }

    if (appointment.status === "COMPLETED") {
      return NextResponse.json(
        {
          message: "Cannot cancel completed appointment",
        },
        { status: 400 }
      );
    }

    // Update appointment status to "CANCELLED"
    const updatedAppointment = await db.appointment.update({
      where: { id: appointmentId },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
