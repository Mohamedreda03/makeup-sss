import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

// GET /api/cloudinary/check - Check Cloudinary configuration
export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow admins to check configuration
    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Cloudinary environment variables are set
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const isConfigured = !!(cloudName && apiKey && apiSecret);

    // Test ping to Cloudinary API
    let pingResult = "Not tested";
    let error = null;

    if (isConfigured) {
      try {
        // Ping Cloudinary by fetching account info
        const result = await cloudinary.api.ping();
        pingResult = result.status === "ok" ? "Success" : "Failed";
      } catch (err: any) {
        error = err.message || String(err);
        pingResult = "Failed";
      }
    }

    // Return configuration status (without exposing the actual secrets)
    return NextResponse.json({
      isConfigured,
      configuration: {
        cloudName: cloudName || "Not set",
        apiKey: apiKey ? "Set (hidden)" : "Not set",
        apiSecret: apiSecret ? "Set (hidden)" : "Not set",
      },
      pingResult,
      error,
    });
  } catch (error: any) {
    console.error("Error checking Cloudinary configuration:", error);
    return NextResponse.json(
      {
        error: "Failed to check Cloudinary configuration",
        message: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
