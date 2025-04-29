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

    // Verify that the user is an artist
    if (user.role !== "ARTIST" && user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden - Access denied" },
        { status: 403 }
      );
    }

    // Determine artist ID (for admins viewing a specific artist's appointments)
    let artistId = user.id;
    const url = new URL(req.url);

    if (user.role === "ADMIN" && url.searchParams.get("artistId")) {
      artistId = url.searchParams.get("artistId") as string;
    }

    // Get URL parameters
    const status = url.searchParams.get("status");
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
    const dateParam = url.searchParams.get("date");

    // For calendar view
    const startDateParam = url.searchParams.get("startDate");
    const endDateParam = url.searchParams.get("endDate");

    // Calculate pagination skip
    const skip = (page - 1) * pageSize;

    // Prepare search filter
    const filter: any = { artistId };

    // Add status filter if specified
    if (status && status !== "ALL") {
      filter.status = status;
    }

    // Add date filter if specified (single day)
    if (dateParam) {
      const startDate = new Date(dateParam);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(dateParam);
      endDate.setHours(23, 59, 59, 999);

      filter.datetime = {
        gte: startDate,
        lte: endDate,
      };
    }
    // Add date range filter for calendar view
    else if (startDateParam && endDateParam) {
      const startDate = new Date(startDateParam);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);

      filter.datetime = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Get total appointment count for artist
    const totalAppointments = await db.appointment.count({
      where: filter,
    });

    // Get appointments with user info
    const appointments = await db.appointment.findMany({
      where: filter,
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
      orderBy: {
        datetime: "asc",
      },
      skip: !startDateParam || !endDateParam ? skip : undefined, // Skip pagination for calendar view
      take: !startDateParam || !endDateParam ? pageSize : undefined, // Unlimited for calendar view
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
    console.error("Error fetching artist appointments:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
