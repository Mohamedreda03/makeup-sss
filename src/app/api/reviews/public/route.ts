import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

// Public review submission schema
const publicReviewSchema = z.object({
  artistId: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  rating: z.number().min(1, "Please select a rating").max(5),
  comment: z.string().min(5, "Please provide feedback (minimum 5 characters)"),
  serviceType: z.string().min(2, "Please specify the service you received"),
});

/**
 * POST /api/reviews/public - submit a new public review
 * These reviews are not tied to appointments and can be submitted by any user
 */
export async function POST(req: NextRequest) {
  console.log("Received review submission request");

  try {
    const body = await req.json();
    console.log("Request body:", body);

    // Validate the request body
    const validatedData = publicReviewSchema.parse(body);
    console.log("Validated data:", validatedData); // Check if the artist exists and get the makeup artist ID
    const artistUser = await db.user.findUnique({
      where: {
        id: validatedData.artistId,
        role: "ARTIST",
      },
      include: {
        makeup_artist: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!artistUser || !artistUser.makeup_artist) {
      console.error("Artist not found:", validatedData.artistId);
      return NextResponse.json(
        { message: "Artist not found" },
        { status: 404 }
      );
    }

    console.log("Artist found:", artistUser.name);
    const makeupArtistId = artistUser.makeup_artist.id;

    // Create a temporary user for tracking the review if not already in the system
    let user = await db.user.findUnique({
      where: {
        email: validatedData.email,
      },
    });

    if (!user) {
      console.log("Creating new user with email:", validatedData.email);
      // Create a new user with minimal information
      user = await db.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          role: "CUSTOMER",
        },
      });
      console.log("New user created:", user.id);
    } else {
      console.log("Existing user found:", user.id);
    } // Create a placeholder booking for this review
    console.log("Creating placeholder booking");
    const booking = await db.booking.create({
      data: {
        date_time: new Date(),
        booking_status: "COMPLETED",
        service_type: validatedData.serviceType,
        service_price: 0, // Placeholder price
        total_price: 0, // Placeholder price
        user_id: user.id,
        artist_id: makeupArtistId, // Use the makeup artist ID, not the user ID
      },
    });
    console.log("Booking created:", booking.id); // Create the review
    console.log("Creating review");
    const review = await db.review.create({
      data: {
        rating: validatedData.rating,
        comment: validatedData.comment,
        status: "PENDING", // All reviews start as pending and need admin approval
        user_id: user.id,
        artist_id: makeupArtistId, // Use the makeup artist ID, not the user ID
      },
    });

    console.log("Review created successfully:", review.id);

    return NextResponse.json({
      success: true,
      message: "Review submitted successfully and is pending approval",
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        status: review.status,
        createdAt: review.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating public review:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid review data",
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to submit review",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
