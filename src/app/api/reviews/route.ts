import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Review submission schema
const reviewSchema = z.object({
  appointmentId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(5, "Please provide more detailed feedback"),
});

interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: "CUSTOMER" | "ADMIN" | "ARTIST";
}

/**
 * GET /api/reviews - get reviews for the current user or by artist ID
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const url = new URL(req.url);
    const artistId = url.searchParams.get("artistId");

    console.log("GET /api/reviews - Artist ID:", artistId);
    console.log("Session user:", session?.user?.id); // Allow reviews to be fetched without authentication, but only approved ones for public
    if (artistId) {
      // First, get the makeup artist ID from the user ID
      const makeupArtist = await db.makeUpArtist.findFirst({
        where: {
          user_id: artistId,
        },
        select: {
          id: true,
        },
      });

      if (!makeupArtist) {
        console.log("Makeup artist not found for user ID:", artistId);
        return NextResponse.json([]);
      }

      // If fetching reviews for a specific artist
      const reviews = await db.review.findMany({
        where: {
          artist_id: makeupArtist.id,
          // If user is logged in and is admin or the artist themself, show all reviews
          // Otherwise only show approved reviews
          ...(session?.user?.id === artistId ||
          (session?.user as ExtendedUser)?.role === "ADMIN"
            ? {}
            : { status: "APPROVED" }),
        },
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
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      console.log(`Found ${reviews.length} reviews for artist ${artistId}`);

      // Log review statuses for debugging
      const statusCounts = reviews.reduce(
        (acc: Record<string, number>, review: (typeof reviews)[0]) => {
          acc[review.status] = (acc[review.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      console.log("Review status counts:", statusCounts);

      return NextResponse.json(reviews);
    }

    // If user is not authenticated, return 401
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as ExtendedUser; // If user is admin, return all reviews
    if (user.role === "ADMIN") {
      const reviews = await db.review.findMany({
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
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      return NextResponse.json(reviews);
    }

    // If user is artist, return reviews for the artist
    if (user.role === "ARTIST") {
      // Get the makeup artist ID for this user
      const makeupArtist = await db.makeUpArtist.findFirst({
        where: {
          user_id: session.user.id,
        },
        select: {
          id: true,
        },
      });

      if (!makeupArtist) {
        return NextResponse.json([]);
      }

      const reviews = await db.review.findMany({
        where: {
          artist_id: makeupArtist.id,
        },
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
        },
      });

      return NextResponse.json(reviews);
    } // If user is customer, return reviews written by the user
    const reviews = await db.review.findMany({
      where: {
        user_id: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        artist: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Error in GET /api/reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews - submit a new review
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const user = session.user as ExtendedUser;
    const body = await req.json();

    // Validate the request body
    const validatedData = reviewSchema.parse(body); // Check if the booking exists and belongs to the user
    const booking = await db.booking.findUnique({
      where: {
        id: validatedData.appointmentId,
        user_id: user.id,
        booking_status: "COMPLETED", // Only completed bookings can be reviewed
      },
      select: {
        id: true,
        artist_id: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { message: "Booking not found or not eligible for review" },
        { status: 404 }
      );
    }

    // Check if review already exists for this booking
    const existingReview = await db.review.findFirst({
      where: {
        user_id: user.id,
        artist_id: booking.artist_id,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { message: "You have already submitted a review for this appointment" },
        { status: 400 }
      );
    }

    // Create the review
    const review = await db.review.create({
      data: {
        rating: validatedData.rating,
        comment: validatedData.comment,
        status: "PENDING", // All reviews start as pending and need admin approval
        user_id: user.id,
        artist_id: booking.artist_id,
      },
    });

    return NextResponse.json({
      message: "Review submitted successfully and is pending approval",
      review,
    });
  } catch (error) {
    console.error("Error creating review:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Invalid review data",
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to submit review" },
      { status: 500 }
    );
  }
}
