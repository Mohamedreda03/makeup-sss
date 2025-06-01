import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get the current session
    const session = await auth();

    // Check if the user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user data with makeup artist profile
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        makeup_artist: true,
      },
    });

    // Check if user exists and has ARTIST role
    if (!user || user.role !== "ARTIST" || !user.makeup_artist) {
      return NextResponse.json(
        { error: "Only artists can access this resource" },
        { status: 403 }
      );
    }

    // Calculate earnings from completed bookings
    const completedBookings = await db.booking.findMany({
      where: {
        artist_id: user.makeup_artist.id,
        booking_status: "COMPLETED",
      },
    });
    const totalEarningsFromBookings = completedBookings.reduce(
      (sum, booking) => sum + (booking.total_price || 0),
      0
    );

    // Use the earnings field from the artist model, fallback to calculated earnings
    const totalEarnings =
      user.makeup_artist.earnings || totalEarningsFromBookings; // Create mock transactions based on completed bookings for now
    const mockTransactions = completedBookings.slice(0, 10).map((booking) => ({
      id: `booking-${booking.id}`,
      amount: booking.total_price || 0,
      type: "BOOKING_PAYMENT",
      status: "COMPLETED",
      createdAt: booking.updatedAt.toISOString(),
      description: `Payment for ${booking.service_type} service`,
    }));

    // Return the account and transactions data
    return NextResponse.json({
      account: {
        totalEarnings: totalEarnings,
        pendingPayouts: 0, // Could be calculated based on pending bookings
        availableBalance: totalEarnings, // For now, all earnings are available
        currency: "EGP",
      },
      transactions: mockTransactions,
    });
  } catch (error) {
    console.error("Error fetching artist account:", error);
    return NextResponse.json(
      { error: "Failed to fetch artist account" },
      { status: 500 }
    );
  }
}
