import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Service schema for validation
const serviceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Service name is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  duration: z.coerce
    .number()
    .min(15, "Duration must be at least 15 minutes")
    .optional(),
  isActive: z.boolean().default(true),
  artistId: z.string(),
});

// GET - Get all services for a specific user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    // Get services for the user
    const services = await prisma.artistService.findMany({
      where: {
        artistId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error("[SERVICES_GET]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new service
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const validation = serviceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Invalid data",
          errors: validation.error.errors,
        },
        { status: 400 }
      );
    }
    const { name, description, price, duration, isActive, artistId } =
      validation.data;

    // Verify the user has permission to create a service for this artist
    const user = await prisma.user.findUnique({
      where: { id: artistId },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Artist not found" },
        { status: 404 }
      );
    }

    // Create new service
    const service = await prisma.artistService.create({
      data: {
        name,
        description: description || "",
        price,
        duration: duration || 60,
        isActive,
        artistId,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("[SERVICES_POST]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update an existing service
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const validation = serviceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Invalid data",
          errors: validation.error.errors,
        },
        { status: 400 }
      );
    }
    const { id, name, description, price, duration, isActive, artistId } =
      validation.data;

    if (!id) {
      return NextResponse.json(
        { message: "Service ID is required" },
        { status: 400 }
      );
    }

    // Verify the service exists
    const existingService = await prisma.artistService.findUnique({
      where: { id },
    });

    if (!existingService) {
      return NextResponse.json(
        { message: "Service not found" },
        { status: 404 }
      );
    }

    // Verify the user has permission to update this service
    if (existingService.artistId !== artistId) {
      return NextResponse.json(
        { message: "You don't have permission to update this service" },
        { status: 403 }
      );
    } // Update the service
    const updatedService = await prisma.artistService.update({
      where: { id },
      data: {
        name,
        description: description || "",
        price,
        duration: duration || 60,
        isActive,
      },
    });

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error("[SERVICES_PATCH]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a service
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const artistId = searchParams.get("artistId");

    if (!id || !artistId) {
      return NextResponse.json(
        { message: "Service ID and Artist ID are required" },
        { status: 400 }
      );
    }

    // Verify the service exists
    const existingService = await prisma.artistService.findUnique({
      where: { id },
    });

    if (!existingService) {
      return NextResponse.json(
        { message: "Service not found" },
        { status: 404 }
      );
    }

    // Verify the user has permission to delete this service
    if (existingService.artistId !== artistId) {
      return NextResponse.json(
        { message: "You don't have permission to delete this service" },
        { status: 403 }
      );
    }

    // Delete the service
    await prisma.artistService.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Service deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[SERVICES_DELETE]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
