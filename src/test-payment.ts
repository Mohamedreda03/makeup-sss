import { PrismaClient } from "@/generated/prisma";

// This is a debug script to test the payment creation directly

async function testPaymentCreation() {
  try {
    const prisma = new PrismaClient();

    // Find a test appointment
    const appointment = await prisma.appointment.findFirst({
      where: { status: "CONFIRMED" },
    });

    if (!appointment) {
      console.error("No confirmed appointment found for testing");
      return;
    }

    console.log(`Found test appointment: ${appointment.id}`);

    // Try to create a payment record directly
    const paymentDetail = await prisma.paymentDetail.create({
      data: {
        appointmentId: appointment.id,
        amount: appointment.totalPrice,
        status: "COMPLETED",
        paymentMethod: "credit_card", // Explicitly set payment method
        transactionId: `test_tx_${Date.now()}`,
        paymentGateway: "stripe",
        currency: "USD",
      },
    });

    console.log("Successfully created payment record:", paymentDetail);
  } catch (error) {
    console.error("Error in test:", error);
  }
}

// The script can be run directly for testing
testPaymentCreation();
