import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { db } from "@/lib/db";
import { UserRole } from "@/generated/prisma";

export async function GET() {
  try {
    // Check if the user already exists
    const existingUser = await db.user.findUnique({
      where: { email: "test@example.com" },
    });

    if (existingUser) {
      return NextResponse.json({
        message: "Test user already exists",
        user: {
          email: existingUser.email,
          name: existingUser.name,
        },
      });
    }

    // Create a test user
    const hashedPassword = await hash("password123", 10);

    const user = await db.user.create({
      data: {
        email: "test@example.com",
        name: "Test User",
        password: hashedPassword,
        role: UserRole.CUSTOMER,
      },
    });

    return NextResponse.json({
      message: "Database seeded successfully",
      user: {
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Error seeding database:", error);
    return NextResponse.json(
      { error: "Failed to seed database" },
      { status: 500 }
    );
  }
}
