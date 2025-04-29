import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Type extension for user in session
interface ExtendedUser {
  id: string;
  role: string;
}

// Schema for validating social media data
const socialMediaSchema = z.object({
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  twitter: z.string().optional(),
  tiktok: z.string().optional(),
  website: z.string().optional(),
  bio: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    // Verify user session
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const user = session.user as ExtendedUser;

    // Check if user is an artist
    if (user.role !== "ARTIST") {
      return NextResponse.json(
        { message: "Forbidden - Only artists can update social media" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = socialMediaSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: "Invalid data",
          errors: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { instagram, facebook, twitter, tiktok, website, bio } =
      validationResult.data;

    // Update user in database
    await db.user.update({
      where: { id: user.id },
      data: {
        instagram,
        facebook,
        twitter,
        tiktok,
        website,
        bio,
      },
    });

    return NextResponse.json(
      { message: "Social media information updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[SOCIAL_MEDIA_UPDATE]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
