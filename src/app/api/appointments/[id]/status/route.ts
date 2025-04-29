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
    const { status, notes } = await req.json();

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

    // Only admins and artists can update appointment status
    if (userRole !== "ADMIN" && userRole !== "ARTIST") {
      return NextResponse.json(
        {
          message:
            "Forbidden - You are not allowed to modify appointment status",
        },
        { status: 403 }
      );
    }

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

    // If user is an artist, ensure they are assigned to this appointment
    if (userRole === "ARTIST" && appointment.artistId !== user.id) {
      return NextResponse.json(
        { message: "Forbidden - This appointment is not assigned to you" },
        { status: 403 }
      );
    }

    // Validate appointment status
    const validStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    // Cannot change status if appointment is cancelled or completed (unless admin)
    if (
      (appointment.status === "CANCELLED" ||
        appointment.status === "COMPLETED") &&
      userRole !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          message: "Cannot update cancelled or completed appointment",
        },
        { status: 400 }
      );
    }

    // Update appointment status
    const updateData: any = { status };

    // Add notes if provided
    if (notes) {
      updateData.notes = notes;
    }

    const updatedAppointment = await db.appointment.update({
      where: { id: appointmentId },
      data: updateData,
    });

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error("Error updating appointment status:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
