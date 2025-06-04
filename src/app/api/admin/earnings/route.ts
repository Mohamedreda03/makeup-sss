import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. You must be signed in." },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only admins can access this data." },
        { status: 403 }
      );
    }

    // Get admin earnings
    const adminUser = await db.user.findFirst({
      where: { role: "ADMIN" },
      select: { earnings: true },
    });

    // Get total commission earned (7% from all completed bookings)
    const completedBookingsTotal = await db.booking.aggregate({
      where: {
        booking_status: "COMPLETED",
      },
      _sum: {
        total_price: true,
      },
    });

    const totalBookingsValue = completedBookingsTotal._sum.total_price || 0;
    const expectedCommission = totalBookingsValue * 0.07;
    const actualCommission = adminUser?.earnings || 0;

    return NextResponse.json({
      earnings: {
        totalEarnings: actualCommission,
        expectedCommission: expectedCommission,
        totalBookingsValue: totalBookingsValue,
        commissionRate: 0.07,
        currency: "EGP",
      },
    });
  } catch (error) {
    console.error("Error fetching admin earnings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
