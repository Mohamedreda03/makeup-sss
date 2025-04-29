import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { hash } from "bcrypt";

// Type extension for user in session
interface ExtendedUser {
  id: string;
  role: string;
}

// Schema for updating an artist
const updateArtistSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  facebook: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  tiktok: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  password: z.string().min(8).optional(),
  yearsOfExperience: z.coerce.number().min(0).optional(),
  category: z.string().optional().nullable(),
  defaultPrice: z.coerce.number().min(0).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    // Check if user is admin
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const artistId = params.id;

    // Find artist in database
    const artist = await db.user.findUnique({
      where: {
        id: artistId,
        role: "ARTIST",
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        instagram: true,
        facebook: true,
        twitter: true,
        tiktok: true,
        website: true,
        bio: true,
        createdAt: true,
        yearsOfExperience: true,
        category: true,
        defaultPrice: true,
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
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const artistId = params.id;

    // Check if artist exists
    const existingArtist = await db.user.findUnique({
      where: {
        id: artistId,
        role: "ARTIST",
      },
    });

    if (!existingArtist) {
      return NextResponse.json(
        { message: "Artist not found" },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validation = updateArtistSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid data", errors: validation.error.errors },
        { status: 400 }
      );
    }

    const { password, ...updateData } = validation.data;

    // Prepare update data
    const updatePayload: any = { ...updateData };

    // If password is provided, hash it
    if (password) {
      updatePayload.password = await hash(password, 10);
    }

    // Update artist
    const updatedArtist = await db.user.update({
      where: { id: artistId },
      data: updatePayload,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        instagram: true,
        facebook: true,
        twitter: true,
        tiktok: true,
        website: true,
        bio: true,
        yearsOfExperience: true,
        category: true,
        defaultPrice: true,
      },
    });

    return NextResponse.json(updatedArtist);
  } catch (error) {
    console.error("[ARTIST_PATCH]", error);
    return NextResponse.json(
      { message: "Internal server error" },
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
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const artistId = params.id;

    // Check if artist exists
    const existingArtist = await db.user.findUnique({
      where: {
        id: artistId,
        role: "ARTIST",
      },
    });

    if (!existingArtist) {
      return NextResponse.json(
        { message: "Artist not found" },
        { status: 404 }
      );
    }

    // Delete artist (will cascade delete associated data)
    await db.user.delete({
      where: { id: artistId },
    });

    return NextResponse.json(
      { message: "Artist deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ARTIST_DELETE]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
