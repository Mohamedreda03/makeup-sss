import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/user/profile - Get the current user's profile data
export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "You must be logged in to view profile" },
        { status: 401 }
      );
    }
    const user = await db.user.findUnique({
      where: {
        email: session.user.email!,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { message: "Error fetching user profile" },
      { status: 500 }
    );
  }
}

// PUT /api/user/profile - Update the current user's profile data
export async function PUT(req: Request) {
  try {
    // Verify user session
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;

    if (!userEmail) {
      return NextResponse.json(
        { message: "User email not found in session" },
        { status: 400 }
      );
    } // Get current user data
    const user = await db.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        image: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Parse and validate request body
    const body = await req.json();

    // Basic validation
    if (!body.name || !body.email) {
      return NextResponse.json(
        { message: "Name and email are required" },
        { status: 400 }
      );
    }

    // Prepare update data for user
    const updateData = {
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      address: body.address || null,
    };

    // Check if email is being changed and it already exists
    if (body.email !== user.email) {
      const existingUser = await db.user.findUnique({
        where: { email: body.email },
      });

      if (existingUser) {
        return NextResponse.json(
          { message: "Email is already in use by another account" },
          { status: 400 }
        );
      }
    } // Update user
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[PROFILE_UPDATE]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
