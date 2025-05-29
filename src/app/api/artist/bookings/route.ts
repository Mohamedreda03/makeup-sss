import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { BookingStatus } from "@/generated/prisma";

export async function GET(req: NextRequest) {
  try {
    // Verify user is authenticated and is an artist
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. You must be signed in." },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        makeup_artist: true,
      },
    });

    if (!user || user.role !== "ARTIST" || !user.makeup_artist) {
      return NextResponse.json(
        { error: "Unauthorized. Only artists can access this data." },
        { status: 403 }
      );
    }

    // Get query parameters
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status");
    const dateFilter = url.searchParams.get("date");
    const search = url.searchParams.get("search");
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");

    // Build where clause
    const where: any = {
      artist_id: user.makeup_artist.id,
    };

    if (statusFilter && statusFilter !== "ALL") {
      where.booking_status = statusFilter as BookingStatus;
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      const startOfDay = new Date(filterDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(filterDate.setHours(23, 59, 59, 999));

      where.date_time = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (search) {
      where.OR = [
        {
          user: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          service_type: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    // Get total count for pagination
    const totalCount = await db.booking.count({ where });

    // Get bookings with pagination
    const bookings = await db.booking.findMany({
      where,
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
        artist: true,
      },
      orderBy: {
        date_time: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json({
      bookings,
      pagination: {
        total: totalCount,
        pages: totalPages,
        page,
        pageSize,
      },
    });
  } catch (error) {
    console.error("Error fetching artist bookings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
