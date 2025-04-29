import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hash } from "bcrypt";

// PUT /api/user/password - Update the current user's password
export async function PUT(request: Request) {
  try {
    console.log("Password update request received");
    const session = await auth();

    if (!session || !session.user) {
      console.log("Authentication error: No valid session");
      return NextResponse.json(
        { message: "You must be logged in to change your password" },
        { status: 401 }
      );
    }

    console.log("Authenticated user:", session.user.email);

    const data = await request.json();
    console.log("Request data received:", {
      newPasswordLength: data.newPassword?.length,
    });

    const { newPassword } = data;

    // Validate required fields
    if (!newPassword) {
      console.log("Validation error: Missing required fields");
      return NextResponse.json(
        { message: "New password is required" },
        { status: 400 }
      );
    }

    // Password length validation - only require 8+ characters
    if (newPassword.length < 8) {
      console.log("Validation error: New password too short");
      return NextResponse.json(
        {
          message: "Password must be at least 8 characters long",
        },
        { status: 400 }
      );
    }

    // Get user from database
    console.log("Fetching user from database");
    const user = await db.user.findUnique({
      where: {
        email: session.user.email!,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      console.log("Error: User not found in database");
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Hash new password
    console.log("Hashing new password");
    const hashedPassword = await hash(newPassword, 10);

    // Update user password
    console.log("Updating password in database");
    await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    console.log("Password updated successfully");
    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json(
      { message: "Error updating password" },
      { status: 500 }
    );
  }
}
