import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Test basic database connection and count reviews
    const reviewCount = await db.review.count();

    // Test the updated query structure
    const reviews = await db.review.findMany({
      take: 1,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        artist: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      reviewCount,
      sampleReview: reviews[0] || null,
    });
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
