import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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
        image: true,
        role: true,
        createdAt: true,
        instagram: true,
        facebook: true,
        twitter: true,
        tiktok: true,
        website: true,
        bio: true,
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

    const userId = (session.user as any).id;

    // Get current user data
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        instagram: true,
        facebook: true,
        twitter: true,
        tiktok: true,
        website: true,
        bio: true,
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

    // Prepare update data based on user role
    const updateData: any = {
      name: body.name,
      email: body.email,
      phone: body.phone || null,
    };

    // Include social media fields only for artists
    if (user.role === "ARTIST") {
      // Add social media fields if they're present in the request
      if (body.instagram !== undefined) updateData.instagram = body.instagram;
      if (body.facebook !== undefined) updateData.facebook = body.facebook;
      if (body.twitter !== undefined) updateData.twitter = body.twitter;
      if (body.tiktok !== undefined) updateData.tiktok = body.tiktok;
      if (body.website !== undefined) updateData.website = body.website;
      if (body.bio !== undefined) updateData.bio = body.bio;
    }

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
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        instagram: true,
        facebook: true,
        twitter: true,
        tiktok: true,
        website: true,
        bio: true,
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
