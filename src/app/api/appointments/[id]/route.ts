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

// GET appointment details
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

    const userId = session.user.id;
    const appointmentId = params.id;

    // Fetch appointment
    const appointment = await db.appointment.findUnique({
      where: {
        id: appointmentId,
        userId,
      },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        paymentDetails: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { message: "Appointment not found" },
        { status: 404 }
      );
    }

    // Check if appointment is paid
    let isPaid = false;
    if (appointment.paymentDetails) {
      isPaid = appointment.paymentDetails.status === "COMPLETED";
    }

    // Format response
    return NextResponse.json({
      id: appointment.id,
      datetime: appointment.datetime,
      description: appointment.description,
      status: appointment.status,
      serviceType: appointment.serviceType,
      duration: appointment.duration,
      totalPrice: appointment.totalPrice,
      location: appointment.location,
      notes: appointment.notes,
      artistId: appointment.artistId,
      artistName: appointment.artist?.name || null,
      artistImage: appointment.artist?.image || null,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
      isPaid,
      paymentDetails: appointment.paymentDetails,
    });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json(
      { message: "Failed to fetch appointment" },
      { status: 500 }
    );
  }
}

// Update appointment details
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const appointmentId = params.id;
    const requestData = await req.json();
    const { status, notes, location, description } = requestData;

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

    // Only admins and artists can update appointments
    if (userRole !== "ADMIN" && userRole !== "ARTIST") {
      return NextResponse.json(
        {
          message:
            "Forbidden - You don't have permission to update appointments",
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

    // Validate appointment status if it's being updated
    if (status) {
      const validStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { message: "Invalid status value" },
          { status: 400 }
        );
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
    }

    // Build update data object
    const updateData: any = {};

    // Only update fields that were provided in the request
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (location !== undefined) updateData.location = location;
    if (description !== undefined) updateData.description = description;

    // Update appointment
    const updatedAppointment = await db.appointment.update({
      where: { id: appointmentId },
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
      },
    });

    console.log("Appointment updated:", updatedAppointment);
    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// Update an appointment
export async function PATCH(
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

    const userId = session.user.id;
    const appointmentId = params.id;

    // Get appointment to ensure it belongs to user
    const appointment = await db.appointment.findUnique({
      where: {
        id: appointmentId,
        userId,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { message: "Appointment not found" },
        { status: 404 }
      );
    }

    // Parse request body
    const data = await req.json();
    const { status } = data;

    if (!status) {
      return NextResponse.json(
        { message: "Status is required" },
        { status: 400 }
      );
    }

    // Validate status
    if (!["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].includes(status)) {
      return NextResponse.json(
        { message: "Invalid status value" },
        { status: 400 }
      );
    }

    // Users can only cancel appointments, not change to other statuses
    if (status !== "CANCELLED") {
      return NextResponse.json(
        { message: "Users can only cancel appointments" },
        { status: 403 }
      );
    }

    // Update appointment
    const updatedAppointment = await db.appointment.update({
      where: {
        id: appointmentId,
      },
      data: {
        status,
      },
    });

    return NextResponse.json({
      message: "Appointment updated successfully",
      appointment: {
        id: updatedAppointment.id,
        status: updatedAppointment.status,
      },
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { message: "Failed to update appointment" },
      { status: 500 }
    );
  }
}
