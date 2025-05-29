import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { BookingStatus } from "@/generated/prisma";

export async function GET() {
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

    // Get analytics data
    const artistId = user.makeup_artist.id;

    // Get total bookings count
    const totalBookings = await db.booking.count({
      where: {
        artist_id: artistId,
      },
    });

    // Get completed bookings count
    const completedBookings = await db.booking.count({
      where: {
        artist_id: artistId,
        booking_status: BookingStatus.COMPLETED,
      },
    });

    // Get total earnings
    const totalEarnings = await db.booking.aggregate({
      where: {
        artist_id: artistId,
        booking_status: BookingStatus.COMPLETED,
      },
      _sum: {
        service_price: true,
      },
    });

    // Get monthly bookings for the current year
    const currentYear = new Date().getFullYear();
    const monthlyBookings = await db.booking.groupBy({
      by: ["date_time"],
      where: {
        artist_id: artistId,
        date_time: {
          gte: new Date(`${currentYear}-01-01`),
          lt: new Date(`${currentYear + 1}-01-01`),
        },
      },
      _count: {
        id: true,
      },
    });

    const analytics = {
      totalBookings,
      completedBookings,
      totalEarnings: totalEarnings._sum.service_price || 0,
      monthlyBookings: monthlyBookings.length,
      conversionRate:
        totalBookings > 0
          ? ((completedBookings / totalBookings) * 100).toFixed(1)
          : 0,
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}
