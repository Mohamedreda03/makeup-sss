import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Get the current session
    const session = await auth();

    // Check if the user is authenticated
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user data
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    // Check if user exists and has ARTIST role
    if (!user || user.role !== "ARTIST") {
      return NextResponse.json(
        { error: "Only artists can access this resource" },
        { status: 403 }
      );
    }

    // Get artist account or create default response if not exists
    const artistAccount = await db.artistAccount.findUnique({
      where: { userId: user.id },
    });

    if (!artistAccount) {
      return NextResponse.json({
        account: {
          totalEarnings: 0,
          pendingPayouts: 0,
          availableBalance: 0,
        },
        transactions: [],
      });
    }

    // Get transactions for this artist account
    const transactions = await db.transaction.findMany({
      where: { artistAccountId: artistAccount.id },
      include: {
        artistAccount: true,
        order: true,
        Appointment: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Return the account and transactions data
    return NextResponse.json({
      account: {
        totalEarnings: artistAccount.totalEarnings,
        pendingPayouts: artistAccount.pendingPayouts,
        availableBalance: artistAccount.availableBalance,
      },
      transactions,
    });
  } catch (error) {
    console.error("Error fetching artist account:", error);
    return NextResponse.json(
      { error: "Failed to fetch artist account" },
      { status: 500 }
    );
  }
}
