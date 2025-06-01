import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { message: "Token is required" },
        { status: 400 }
      );
    }

    // Find the token in the database
    const resetToken = await db.passwordReset.findUnique({
      where: { token },
    });

    // Check if token exists and is not expired
    if (!resetToken) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { message: "Token has expired" },
        { status: 400 }
      );
    }

    // Token is valid
    return NextResponse.json({ message: "Token is valid" }, { status: 200 });
  } catch (error) {
    console.error("Error verifying reset token:", error);
    return NextResponse.json(
      { message: "An error occurred while verifying the token" },
      { status: 500 }
    );
  }
}
