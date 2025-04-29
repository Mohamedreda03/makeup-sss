import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  AppointmentStatus,
  TransactionStatus,
  TransactionType,
} from "@/generated/prisma";

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

    // 1. Find the appointment
    const appointment = await db.appointment.findUnique({
      where: { id },
      include: { artist: true },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    if (!appointment.artistId) {
      return NextResponse.json(
        { error: "No artist assigned to this appointment" },
        { status: 400 }
      );
    }

    // 2. Update appointment status to COMPLETED
    const updatedAppointment = await db.appointment.update({
      where: { id: appointment.id },
      data: { status: AppointmentStatus.COMPLETED },
    });

    console.log("Updated appointment status to COMPLETED");

    // 3. Create payment record
    const paymentDetail = await db.paymentDetail.create({
      data: {
        appointmentId: appointment.id,
        amount: appointment.totalPrice,
        status: "COMPLETED",
        paymentMethod: paymentDetails.paymentMethod,
        transactionId: paymentDetails.transactionId,
        paymentGateway: "stripe",
        currency: "USD",
      },
    });

    console.log("Created payment record");

    // 4. Find or create artist account
    let artistAccount = await db.artistAccount.findUnique({
      where: { userId: appointment.artistId },
    });

    if (!artistAccount) {
      artistAccount = await db.artistAccount.create({
        data: {
          userId: appointment.artistId,
          totalEarnings: 0,
          pendingPayouts: 0,
          availableBalance: 0,
        },
      });
      console.log("Created new artist account");
    }

    // 5. Update artist account balances
    const updatedArtistAccount = await db.artistAccount.update({
      where: { id: artistAccount.id },
      data: {
        totalEarnings: artistAccount.totalEarnings + appointment.totalPrice,
        availableBalance:
          artistAccount.availableBalance + appointment.totalPrice,
      },
    });

    console.log("Updated artist account balance");

    // 6. Create transaction record
    const transaction = await db.transaction.create({
      data: {
        artistAccountId: artistAccount.id,
        amount: appointment.totalPrice,
        type: TransactionType.SALE,
        status: TransactionStatus.COMPLETED,
        description: `Payment for appointment on ${new Date(
          appointment.datetime
        ).toLocaleDateString()}`,
        appointmentId: appointment.id,
      },
    });

    console.log("Created transaction record");

    return NextResponse.json({
      success: true,
      message: "Payment processed successfully",
      data: {
        appointment: updatedAppointment,
        payment: paymentDetail,
        artistAccount: updatedArtistAccount,
        transaction,
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

    const appointmentId = params.id;
    const userId = session.user.id;

    // Check if appointment exists and belongs to user
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

    // Check if appointment is paid - consider COMPLETED status as paid
    const isPaid = appointment.status === "COMPLETED";

    return NextResponse.json({
      id: appointment.id,
      status: appointment.status,
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
