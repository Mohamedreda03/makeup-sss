import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { hash } from "bcrypt";

// Type extension for user in session
interface ExtendedUser {
  id: string;
  role: string;
}

// Service schema for validation
const serviceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

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
  image: z.string().optional().nullable(),
  services: z.array(serviceSchema).optional(),
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
    const artist = await prisma.user.findUnique({
      where: {
        id: artistId,
        role: "ARTIST",
      },
      include: {
        services: true,
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

    // Log the artist ID for debugging
    console.log("[API] PATCH artist - Artist ID:", artistId);

    // Check if artist exists
    const existingArtist = await prisma.user.findUnique({
      where: {
        id: artistId,
        role: "ARTIST",
      },
      include: {
        services: true,
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

    const { password, services, ...updateData } = validation.data;

    // Log the image URL for debugging
    console.log("[API] PATCH artist - Image being updated:", {
      current: existingArtist.image,
      new: updateData.image,
    });

    // Prepare update data - excluding fields not in the User model
    const { category, ...validUpdateData } = updateData;
    const updatePayload: any = { ...validUpdateData };

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
      // Use a transaction to update the artist and their services
      await prisma.$transaction(async (tx) => {
        // Update artist
        await tx.user.update({
          where: { id: artistId },
          data: updatePayload,
        });

        // Handle services if provided
        if (services && services.length > 0) {
          // Get existing service IDs
          const existingServiceIds = existingArtist.services.map(
            (service: any) => service.id
          );

          // Find services to delete (those in existingServiceIds but not in the incoming services)
          const incomingServiceIds = services
            .filter((service) => service.id)
            .map((service) => service.id as string);

          const serviceIdsToDelete = existingServiceIds.filter(
            (id: string) => !incomingServiceIds.includes(id)
          );

          // Delete services that are no longer needed
          if (serviceIdsToDelete.length > 0) {
            await tx.artistService.deleteMany({
              where: {
                id: {
                  in: serviceIdsToDelete,
                },
              },
            });
          }

          // Update or create services
          for (const service of services) {
            if (service.id) {
              // Update existing service
              await tx.artistService.update({
                where: {
                  id: service.id,
                },
                data: {
                  name: service.name,
                  description: service.description || "",
                  price: service.price || 0,
                  isActive: service.isActive ?? true,
                },
              });
            } else {
              // Create new service
              await tx.artistService.create({
                data: {
                  name: service.name,
                  description: service.description || "",
                  price: service.price || 0,
                  isActive: service.isActive ?? true,
                  artistId: artistId,
                },
              });
            }
          }
        }
      });
    } catch (dbError: any) {
      console.error("[API] PATCH artist - Database error:", dbError);
      return NextResponse.json(
        {
          message: "Database error updating artist",
          details: dbError.message || "Unknown database error",
        },
        { status: 500 }
      );
    }

    try {
      // Fetch updated artist with services to return
      const updatedArtist = await prisma.user.findUnique({
        where: { id: artistId },
        include: {
          services: true,
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
