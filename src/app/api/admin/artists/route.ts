import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hash } from "bcrypt";
import { z } from "zod";

// Type extension for user in session
interface ExtendedUser {
  id: string;
  role: string;
}

// Schema for creating a new artist
const createArtistSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  image: z.string().optional(),
  role: z.enum(["ARTIST"]),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  twitter: z.string().optional(),
  tiktok: z.string().optional(),
  website: z.string().optional(),
  bio: z.string().optional(),
  yearsOfExperience: z.coerce.number().min(0).optional(),
  category: z.string().optional(),
  defaultPrice: z.coerce.number().min(0).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // Check if user is admin
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build where condition
    let whereCondition: any = {
      role: "ARTIST",
    };

    if (search) {
      whereCondition = {
        ...whereCondition,
        OR: [
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
        ],
      };
    }

    // Get artists with pagination
    const artists = await db.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        createdAt: true,
        category: true,
        defaultPrice: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    // Get total count for pagination
    const totalArtists = await db.user.count({
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
    if (!session?.user || (session.user as any).role !== "ADMIN") {
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

    const {
      name,
      email,
      password,
      phone,
      image,
      role,
      instagram,
      facebook,
      twitter,
      tiktok,
      website,
      bio,
      yearsOfExperience,
      category,
      defaultPrice,
    } = validation.data;

    // Check if user with email already exists
    const existingUser = await db.user.findUnique({
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

    // Create new artist
    const artist = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        image,
        role,
        instagram,
        facebook,
        twitter,
        tiktok,
        website,
        bio,
        yearsOfExperience: yearsOfExperience || 0,
        category,
        defaultPrice: defaultPrice || 0,
      },
    });

    // Return success response without password
    return NextResponse.json(
      {
        message: "Artist created successfully",
        artist: {
          id: artist.id,
          name: artist.name,
          email: artist.email,
          image: artist.image,
          phone: artist.phone,
          instagram: artist.instagram,
          facebook: artist.facebook,
          twitter: artist.twitter,
          tiktok: artist.tiktok,
          website: artist.website,
          bio: artist.bio,
          yearsOfExperience: artist.yearsOfExperience,
          category: artist.category,
          defaultPrice: artist.defaultPrice,
        },
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
