import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hash } from "bcrypt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Schema for creating a new artist
const createArtistSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  image: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // Check if user is admin
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build where condition
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereCondition: any = {
      role: "ARTIST",
    };

    if (search) {
      whereCondition.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    // Get artists with pagination
    const artists = await prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        phone: true,
        createdAt: true,
        makeup_artist: {
          select: {
            pricing: true,
            experience_years: true,
            rating: true,
            bio: true,
          },
        },
        services: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    // Get total count for pagination
    const totalArtists = await prisma.user.count({
      where: whereCondition,
    });

    // Return paginated results
    return NextResponse.json({
      artists,
      totalPages: Math.ceil(totalArtists / limit),
      currentPage: page,
      totalArtists,
    });
  } catch (error) {
    console.error("[ARTISTS_GET]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Check if user is admin
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = createArtistSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid data", errors: validation.error.errors },
        { status: 400 }
      );
    }

    const { name, email, password, image } = validation.data;

    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Use a transaction to create the artist and their makeup artist profile
    const createdArtist = await prisma.$transaction(async (tx) => {
      // Create new user
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "ARTIST",
          image,
        },
      });

      // Create makeup artist profile with default values
      const makeupArtist = await tx.makeUpArtist.create({
        data: {
          user_id: newUser.id,
          bio: "",
          availability: false,
        },
      });

      return { user: newUser, makeupArtist };
    });

    return NextResponse.json(
      {
        message: "Artist created successfully",
        artist: createdArtist,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[ARTISTS_POST]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    // Check if user is admin
    if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get("id");

    if (!artistId) {
      return NextResponse.json(
        { message: "Artist ID is required" },
        { status: 400 }
      );
    }

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
    console.error("[ARTISTS_DELETE]", error);
    return NextResponse.json(
      { message: "Internal server error while deleting artist" },
      { status: 500 }
    );
  }
}
