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

    // Find the makeup artist record
    const makeupArtist = await db.makeUpArtist.findUnique({
      where: { user_id: user.id },
    });

    if (!makeupArtist) {
      return NextResponse.json(
        { message: "Artist profile not found" },
        { status: 404 }
      );
    }

    // Get URL parameters
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
    const dateParam = url.searchParams.get("date");

    // For calendar view
    const startDateParam = url.searchParams.get("startDate");
    const endDateParam = url.searchParams.get("endDate");

    // Calculate pagination skip
    const skip = (page - 1) * pageSize;

    // Prepare search filter using artist_id from makeup artist record
    const filter: any = { artist_id: makeupArtist.id };

    // Add status filter if specified
    if (status && status !== "ALL") {
      filter.booking_status = status;
    }

    // Add date filter if specified (single day)
    if (dateParam) {
      const startDate = new Date(dateParam);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(dateParam);
      endDate.setHours(23, 59, 59, 999);

      filter.date_time = {
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

      filter.date_time = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Get total booking count for artist
    const totalBookings = await db.booking.count({
      where: filter,
    });

    // Get bookings with user info
    const bookings = await db.booking.findMany({
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
        date_time: "asc",
      },
      skip: !startDateParam || !endDateParam ? skip : undefined, // Skip pagination for calendar view
      take: !startDateParam || !endDateParam ? pageSize : undefined, // Unlimited for calendar view
    });

    return NextResponse.json({
      appointments: bookings,
      pagination: {
        total: totalBookings,
        pages: Math.ceil(totalBookings / pageSize),
        page,
        pageSize,
      },
    });
  } catch (error) {
    console.error("Error fetching artist appointments:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
