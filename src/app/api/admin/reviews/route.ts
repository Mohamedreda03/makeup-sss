import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ExtendedUser } from "@/types/next-auth";

// Review action schema for approving/rejecting reviews
const reviewActionSchema = z.object({
  reviewId: z.string(),
  action: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().optional(), // Optional reason for rejection
});

/**
 * GET /api/admin/reviews - get all reviews for admin management
 * Can be filtered by status
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const user = session.user as ExtendedUser;

    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    // Build the filter based on status
    const filter: any = {};
    if (status) {
      filter.status = status;
    }

    // Get total count for pagination
    const totalReviews = await db.review.count({
      where: filter,
    });

    // Get reviews with pagination
    const reviews = await db.review.findMany({
      where: filter,
      orderBy: {
        createdAt: "desc",
      },
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
            name: true,
            image: true,
          },
        },
        appointment: {
          select: {
            serviceType: true,
            datetime: true,
          },
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      reviews,
      pagination: {
        total: totalReviews,
        pageCount: Math.ceil(totalReviews / pageSize),
        page,
        pageSize,
      },
    });
  } catch (error) {
    console.error("Error fetching reviews for admin:", error);
    return NextResponse.json(
      { message: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/reviews - approve or reject a review
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const user = session.user as ExtendedUser;

    // Only admin can access this endpoint
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Validate the request body
    const validatedData = reviewActionSchema.parse(body);

    // Check if the review exists
    const review = await db.review.findUnique({
      where: {
        id: validatedData.reviewId,
      },
    });

    if (!review) {
      return NextResponse.json(
        { message: "Review not found" },
        { status: 404 }
      );
    }

    // Update the review status based on the action
    const newStatus =
      validatedData.action === "APPROVE" ? "APPROVED" : "REJECTED";

    const updatedReview = await db.review.update({
      where: {
        id: validatedData.reviewId,
      },
      data: {
        status: newStatus,
      },
    });

    return NextResponse.json({
      message: `Review has been ${newStatus.toLowerCase()}`,
      review: updatedReview,
    });
  } catch (error) {
    console.error("Error updating review status:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Invalid data",
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to update review status" },
      { status: 500 }
    );
  }
}
