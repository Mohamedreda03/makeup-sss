import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";

// POST /api/cloudinary/signature - Generate a secure signature for Cloudinary uploads
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { folder = "profile-images", publicId } = body;

    // Generate a timestamp
    const timestamp = Math.round(new Date().getTime() / 1000);

    // Create the signature using the Cloudinary SDK
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        folder: folder,
        public_id: publicId || `user_${session.user.id}_${timestamp}`,
        // Add any other parameters you want to include in the signature
      },
      process.env.CLOUDINARY_API_SECRET || ""
    );

    // Return the necessary info for the frontend to complete the upload
    return NextResponse.json({
      signature,
      timestamp,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
      folder,
      publicId: publicId || `user_${session.user.id}_${timestamp}`,
    });
  } catch (error) {
    console.error("Error generating Cloudinary signature:", error);
    return NextResponse.json(
      { error: "Failed to generate signature" },
      { status: 500 }
    );
  }
}
