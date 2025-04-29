import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/user/profile-image - Update the user's profile image
export async function POST(request: Request) {
  try {
    console.log("Profile image update API called");

    const session = await auth();
    if (!session || !session.user) {
      console.log("User not authenticated");
      return NextResponse.json(
        { message: "You must be logged in to update your profile image" },
        { status: 401 }
      );
    }

    console.log("User authenticated:", session.user.email);

    // Receive image URL as JSON data
    const data = await request.json();
    console.log("Received request data:", { hasImageUrl: !!data.imageUrl });

    const { imageUrl } = data;
    if (!imageUrl) {
      console.log("No image URL provided in request");
      return NextResponse.json(
        { message: "No image URL provided" },
        { status: 400 }
      );
    }

    // Remove any existing cache-busting parameters
    const cleanImageUrl = imageUrl.split("?")[0];

    console.log("Image URL format check:", {
      isString: typeof cleanImageUrl === "string",
      length: cleanImageUrl.length,
      startsWithHttp: cleanImageUrl.startsWith("http"),
    });

    // Update user with the image URL
    console.log("Updating user profile in database...");
    const user = await db.user.update({
      where: {
        email: session.user.email!,
      },
      data: {
        image: cleanImageUrl,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });

    console.log("User profile updated successfully");

    // Add cache-busting timestamp to the returned image URL
    const currentTimestamp = Date.now();
    const cachedBustingImageUrl = `${cleanImageUrl}?t=${currentTimestamp}`;

    return NextResponse.json({
      message: "Profile image updated successfully",
      user: {
        ...user,
        image: cachedBustingImageUrl,
      },
      imageUrl: cachedBustingImageUrl,
      timestamp: currentTimestamp,
    });
  } catch (error) {
    console.error("Error updating profile image:", error);

    // Provide more detailed error information
    let errorMessage = "Error updating profile image";
    let errorDetails = null;

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      };
    }

    return NextResponse.json(
      {
        message: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}
