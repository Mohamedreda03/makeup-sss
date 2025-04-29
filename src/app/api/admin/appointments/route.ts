import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Appointment } from "@/generated/prisma";

// Extended user interface
interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

// Define interface for appointment with related entities
interface AppointmentWithRelations extends Appointment {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  artist: {
    id: string;
    name: string | null;
  } | null;
}

// GET /api/admin/appointments
export async function GET(req: Request) {
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

    // Get query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "50");
    const search = url.searchParams.get("search") || "";

    // Build filter
    const filter: any = {};

    // Add status filter if specified
    if (status && status !== "all") {
      filter.status = status.toUpperCase();
    }

    // Add search filter if specified
    if (search) {
      filter.OR = [
        {
          serviceType: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          location: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          user: {
            OR: [
              {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                email: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                phone: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          },
        },
        {
          artist: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    // Get appointments
    const appointments = await db.appointment.findMany({
      where: filter,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        artist: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        datetime: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Format response for client consumption
    const formattedAppointments = appointments.map(
      (appointment: AppointmentWithRelations) => ({
        id: appointment.id,
        datetime: appointment.datetime,
        description: appointment.description,
        status: appointment.status,
        userId: appointment.userId,
        userName: appointment.user?.name || null,
        userEmail: appointment.user?.email || null,
        userPhone: appointment.user?.phone || null,
        artistId: appointment.artistId,
        artistName: appointment.artist?.name || null,
        serviceType: appointment.serviceType,
        duration: appointment.duration,
        totalPrice: appointment.totalPrice,
        location: appointment.location,
        notes: appointment.notes,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
      })
    );

    return NextResponse.json(formattedAppointments);
  } catch (error) {
    console.error("Error fetching appointments for admin:", error);
    return NextResponse.json(
      { message: "Server error", error: String(error) },
      { status: 500 }
    );
  }
}
