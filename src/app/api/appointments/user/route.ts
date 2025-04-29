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

export async function GET(req: Request) {
  try {
    // Verify session and permissions
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const user = session.user as ExtendedUser;
    const userId = user.id;

    // Get URL parameters
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");

    // Calculate pagination skip
    const skip = (page - 1) * pageSize;

    // Prepare search filter
    const filter: any = { userId };

    // Add status filter if specified
    if (status && status !== "ALL") {
      filter.status = status;
    }

    // Get total appointment count for user
    const totalAppointments = await db.appointment.count({
      where: filter,
    });

    // Get appointments with user and artist info
    const appointments = await db.appointment.findMany({
      where: filter,
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: pageSize,
    });

    return NextResponse.json({
      appointments,
      pagination: {
        total: totalAppointments,
        pages: Math.ceil(totalAppointments / pageSize),
        page,
        pageSize,
      },
    });
  } catch (error) {
    console.error("Error fetching user appointments:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
