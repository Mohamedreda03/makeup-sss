import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { hash } from "bcrypt";

// Schema for updating an artist
const updateArtistSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  password: z.string().min(8).optional(),
  // Makeup artist specific fields
  pricing: z.coerce.number().min(0).optional(),
  experience_years: z.string().optional(),
  portfolio: z.string().optional().nullable(),
  gender: z.string().optional(),
  availability: z.boolean().optional(),
  // Social media fields
  instagram_url: z
    .string()
    .url("Please enter a valid Instagram URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  facebook_url: z
    .string()
    .url("Please enter a valid Facebook URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  twitter_url: z
    .string()
    .url("Please enter a valid Twitter URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  tiktok_url: z
    .string()
    .url("Please enter a valid TikTok URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  youtube_url: z
    .string()
    .url("Please enter a valid YouTube URL")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    // Check if user is admin
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const artistId = params.id;

    // Find artist in database
    const artist = await prisma.user.findUnique({
      where: {
        id: artistId,
        role: "ARTIST",
      },
      include: {
        makeup_artist: true,
        services: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!artist) {
      return NextResponse.json(
        { message: "Artist not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(artist);
  } catch (error) {
    console.error("[ARTIST_GET]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    // Check if user is admin
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const artistId = params.id;

    // Log the artist ID for debugging
    console.log("[API] PATCH artist - Artist ID:", artistId);

    // Check if artist exists
    const existingArtist = await prisma.user.findUnique({
      where: {
        id: artistId,
        role: "ARTIST",
      },
      include: {
        makeup_artist: true,
      },
    });

    if (!existingArtist) {
      return NextResponse.json(
        { message: "Artist not found" },
        { status: 404 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log("[API] PATCH artist - Request body:", {
        ...body,
        password: body.password ? "****" : undefined,
      });
    } catch (error) {
      console.error("[API] PATCH artist - Error parsing request body:", error);
      return NextResponse.json(
        { message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const validation = updateArtistSchema.safeParse(body);

    if (!validation.success) {
      console.error(
        "[API] PATCH artist - Validation errors:",
        validation.error.errors
      );
      return NextResponse.json(
        { message: "Invalid data", errors: validation.error.errors },
        { status: 400 }
      );
    }

    const {
      password,
      pricing,
      experience_years,
      portfolio,
      gender,
      availability,
      bio,
      instagram_url,
      facebook_url,
      twitter_url,
      tiktok_url,
      youtube_url,
      ...updateData
    } = validation.data;

    // Log the image URL for debugging
    console.log("[API] PATCH artist - Image being updated:", {
      current: existingArtist.image,
      new: updateData.image,
    });

    // Prepare update data for User model (exclude bio as it belongs to MakeUpArtist model)
    const updatePayload: Partial<{
      name: string;
      email: string;
      phone: string | null;
      address: string | null;
      image: string | null;
      password: string;
    }> = { ...updateData };

    // If password is provided, hash it
    if (password) {
      try {
        updatePayload.password = await hash(password, 10);
      } catch (hashError) {
        console.error(
          "[API] PATCH artist - Error hashing password:",
          hashError
        );
        return NextResponse.json(
          { message: "Error processing password" },
          { status: 500 }
        );
      }
    }

    try {
      // Use a transaction to update the artist and their makeup artist profile
      await prisma.$transaction(async (tx) => {
        // Update user data
        await tx.user.update({
          where: { id: artistId },
          data: updatePayload,
        });

        // Update or create makeup artist profile if makeup artist fields are provided
        if (
          pricing !== undefined ||
          experience_years !== undefined ||
          portfolio !== undefined ||
          gender !== undefined ||
          availability !== undefined ||
          bio !== undefined ||
          instagram_url !== undefined ||
          facebook_url !== undefined ||
          twitter_url !== undefined ||
          tiktok_url !== undefined ||
          youtube_url !== undefined
        ) {
          const makeupArtistData: {
            pricing?: number;
            experience_years?: string;
            portfolio?: string | null;
            gender?: string;
            availability?: boolean;
            bio?: string | null;
            address?: string;
            instagram_url?: string | null;
            facebook_url?: string | null;
            twitter_url?: string | null;
            tiktok_url?: string | null;
            youtube_url?: string | null;
          } = {};

          if (pricing !== undefined) makeupArtistData.pricing = pricing;
          if (experience_years !== undefined)
            makeupArtistData.experience_years = experience_years;
          if (portfolio !== undefined) makeupArtistData.portfolio = portfolio;
          if (gender !== undefined) makeupArtistData.gender = gender;
          if (availability !== undefined)
            makeupArtistData.availability = availability;
          if (bio !== undefined) makeupArtistData.bio = bio;
          if (updateData.address !== undefined)
            makeupArtistData.address = updateData.address || "";
          if (instagram_url !== undefined)
            makeupArtistData.instagram_url = instagram_url || null;
          if (facebook_url !== undefined)
            makeupArtistData.facebook_url = facebook_url || null;
          if (twitter_url !== undefined)
            makeupArtistData.twitter_url = twitter_url || null;
          if (tiktok_url !== undefined)
            makeupArtistData.tiktok_url = tiktok_url || null;
          if (youtube_url !== undefined)
            makeupArtistData.youtube_url = youtube_url || null;

          await tx.makeUpArtist.upsert({
            where: { user_id: artistId },
            update: makeupArtistData,
            create: {
              user_id: artistId,
              pricing: pricing || 0,
              experience_years: experience_years || "0 years",
              portfolio: portfolio || null,
              gender: gender || "Not specified",
              rating: 0,
              address: updateData.address || "",
              bio: bio || null,
              availability: availability ?? false,
              instagram_url: instagram_url || null,
              facebook_url: facebook_url || null,
              twitter_url: twitter_url || null,
              tiktok_url: tiktok_url || null,
              youtube_url: youtube_url || null,
            },
          });
        }
      });
    } catch (dbError: unknown) {
      console.error("[API] PATCH artist - Database error:", dbError);
      const errorMessage =
        dbError instanceof Error ? dbError.message : "Unknown database error";
      return NextResponse.json(
        {
          message: "Database error updating artist",
          details: errorMessage,
        },
        { status: 500 }
      );
    }

    try {
      // Fetch updated artist with makeup artist profile to return
      const updatedArtist = await prisma.user.findUnique({
        where: { id: artistId },
        include: {
          makeup_artist: true,
          services: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

      console.log(
        "[API] PATCH artist - Update successful, image in DB:",
        updatedArtist?.image
      );

      return NextResponse.json(updatedArtist);
    } catch (queryError) {
      console.error(
        "[API] PATCH artist - Error fetching updated artist:",
        queryError
      );
      return NextResponse.json(
        { message: "Artist updated but couldn't fetch updated data" },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("[ARTIST_PATCH] Unhandled error:", error);
    // Return more detailed error information
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        message: "Internal server error",
        details: errorMessage,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    // Check if user is admin
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const artistId = params.id;

    // Check if artist exists and is actually an artist
    const existingArtist = await prisma.user.findUnique({
      where: {
        id: artistId,
        role: "ARTIST",
      },
      include: {
        makeup_artist: true,
        services: true,
        bookings: true,
        reviews: true,
        orders: true,
        cart: true,
        accounts: true,
        sessions: true,
        passwordResets: true,
      },
    });

    if (!existingArtist) {
      return NextResponse.json(
        { message: "Artist not found" },
        { status: 404 }
      );
    }

    // Use transaction to ensure all deletions happen atomically
    const deletionSummary = await prisma.$transaction(async (tx) => {
      let deletedCounts = {
        reviews: 0,
        bookings: 0,
        services: 0,
        cartItems: 0,
        cart: 0,
        orders: 0,
        accounts: 0,
        sessions: 0,
        passwordResets: 0,
        makeupArtist: 0,
        user: 0,
      };

      // 1. Delete reviews (both given and received)
      if (existingArtist.makeup_artist) {
        const deletedReviews = await tx.review.deleteMany({
          where: {
            OR: [
              { user_id: artistId }, // Reviews given by artist
              { artist_id: existingArtist.makeup_artist.id }, // Reviews received by artist
            ],
          },
        });
        deletedCounts.reviews = deletedReviews.count;
      }

      // 2. Delete bookings (as customer and as artist)
      if (existingArtist.makeup_artist) {
        const deletedBookings = await tx.booking.deleteMany({
          where: {
            OR: [
              { user_id: artistId }, // Bookings made by artist
              { artist_id: existingArtist.makeup_artist.id }, // Bookings for artist
            ],
          },
        });
        deletedCounts.bookings = deletedBookings.count;
      }

      // 3. Delete artist services
      const deletedServices = await tx.artistService.deleteMany({
        where: { artistId: artistId },
      });
      deletedCounts.services = deletedServices.count;

      // 4. Delete cart items if artist has cart
      if (existingArtist.cart) {
        const deletedCartItems = await tx.cartItem.deleteMany({
          where: { cart_id: existingArtist.cart.id },
        });
        deletedCounts.cartItems = deletedCartItems.count;

        // 5. Delete cart
        await tx.cart.delete({
          where: { id: existingArtist.cart.id },
        });
        deletedCounts.cart = 1;
      }

      // 6. Delete orders and order details
      if (existingArtist.orders.length > 0) {
        // Delete order details first
        await tx.orderDetails.deleteMany({
          where: {
            order_id: {
              in: existingArtist.orders.map((order) => order.id),
            },
          },
        });

        // Delete payments
        await tx.payment.deleteMany({
          where: {
            order_id: {
              in: existingArtist.orders.map((order) => order.id),
            },
          },
        });

        // Delete orders
        const deletedOrders = await tx.order.deleteMany({
          where: { user_id: artistId },
        });
        deletedCounts.orders = deletedOrders.count;
      }

      // 7. Delete auth-related records
      const deletedAccounts = await tx.account.deleteMany({
        where: { userId: artistId },
      });
      deletedCounts.accounts = deletedAccounts.count;

      const deletedSessions = await tx.session.deleteMany({
        where: { userId: artistId },
      });
      deletedCounts.sessions = deletedSessions.count;

      const deletedPasswordResets = await tx.passwordReset.deleteMany({
        where: { userId: artistId },
      });
      deletedCounts.passwordResets = deletedPasswordResets.count;

      // 8. Delete makeup artist profile
      if (existingArtist.makeup_artist) {
        await tx.makeUpArtist.delete({
          where: { id: existingArtist.makeup_artist.id },
        });
        deletedCounts.makeupArtist = 1;
      }

      // 9. Finally, delete the user
      await tx.user.delete({
        where: { id: artistId },
      });
      deletedCounts.user = 1;

      return deletedCounts;
    });

    return NextResponse.json({
      message: "Artist deleted successfully",
      artist: {
        id: existingArtist.id,
        name: existingArtist.name,
        email: existingArtist.email,
      },
      deletionSummary,
    });
  } catch (error) {
    console.error("[ARTIST_DELETE]", error);
    return NextResponse.json(
      { message: "Internal server error while deleting artist" },
      { status: 500 }
    );
  }
}
