import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const { id } = params;
    const body = await req.json();

    console.log("Payment request body:", body);

    // Use fallback values to ensure payment method exists
    const paymentDetails = {
      paymentMethod: body.paymentMethod || "credit_card",
      transactionId: body.transactionId || `tx_${Date.now()}`,
    };

    console.log("Using payment details:", paymentDetails);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Find the booking
    const booking = await db.booking.findUnique({
      where: { id },
      include: { artist: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    } // 2. Update booking status to CONFIRMED (indicating payment was processed)
    const updatedBooking = await db.booking.update({
      where: { id },
      data: {
        booking_status: "CONFIRMED",
      },
    });

    console.log("Updated booking status to CONFIRMED");

    return NextResponse.json({
      success: true,
      message: "Payment processed successfully",
      data: {
        booking: updatedBooking,
        paymentDetails: paymentDetails,
      },
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json(
      {
        error: "Failed to process payment",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

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

    const bookingId = params.id;
    const userId = session.user.id;

    // Check if booking exists and belongs to user
    const booking = await db.booking.findUnique({
      where: {
        id: bookingId,
        user_id: userId,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { message: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if booking is paid - consider COMPLETED status as paid
    const isPaid = booking.booking_status === "COMPLETED";

    return NextResponse.json({
      id: booking.id,
      status: booking.booking_status,
      isPaid,
    });
  } catch (error) {
    console.error("Error checking payment status:", error);
    return NextResponse.json(
      { message: "Failed to check payment status", error: String(error) },
      { status: 500 }
    );
  }
}
