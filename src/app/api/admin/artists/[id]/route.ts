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
          bio !== undefined
        ) {
          const makeupArtistData: {
            pricing?: number;
            experience_years?: string;
            portfolio?: string | null;
            gender?: string;
            availability?: boolean;
            bio?: string | null;
            address?: string;
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
