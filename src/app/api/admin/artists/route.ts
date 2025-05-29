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
