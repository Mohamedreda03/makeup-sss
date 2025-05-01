import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { artistSettingsSchema } from "@/lib/validations/artist-settings";

// Extended user interface for typing session.user
interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

export async function GET() {
  try {
    // Get the user's session
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as ExtendedUser;

    // Verify the user is an artist
    if (user.role !== "ARTIST") {
      return NextResponse.json(
        { error: "Only artists can access these settings" },
        { status: 403 }
      );
    }

    // Fetch the artist data (user with ARTIST role) from the database
    const artistUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      include: {
        // Include artist account for services information
        ArtistAccount: true,
        // Include metadata for additional artist data
        metadata: true,
        // Include services
        services: true,
      },
    });

    if (!artistUser) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    // Parse additional artist settings from metadata if available
    let certificates: string[] = [];
    let specialties: string[] = [];

    if (artistUser.metadata?.artistSettings) {
      try {
        const artistSettings = JSON.parse(artistUser.metadata.artistSettings);
        certificates = artistSettings.certificates || [];
        specialties = artistSettings.specialties || [];
      } catch (e) {
        console.error("Error parsing artist settings from metadata:", e);
      }
    }

    // Transform the artist data to match our schema
    const artistSettings = {
      name: artistUser.name,
      email: artistUser.email,
      image: artistUser.image,
      yearsOfExperience: artistUser.yearsOfExperience,
      bio: artistUser.bio,
      instagram: artistUser.instagram,
      facebook: artistUser.facebook,
      twitter: artistUser.twitter,
      tiktok: artistUser.tiktok,
      website: artistUser.website,
      defaultPrice: artistUser.defaultPrice,
      certificates,
      services: artistUser.services,
      specialties,
    };

    return NextResponse.json(artistSettings);
  } catch (error) {
    console.error("Error fetching artist settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch artist settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    // Get the user's session
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as ExtendedUser;

    // Verify the user is an artist
    if (user.role !== "ARTIST") {
      return NextResponse.json(
        { error: "Only artists can update these settings" },
        { status: 403 }
      );
    }

    // Parse the request body
    const body = await request.json();

    // Validate the request body against our schema
    const validationResult = artistSettingsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid data",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Find the user by id
    const artistUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      include: {
        services: true,
      },
    });

    if (!artistUser) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    // Start a transaction to update everything
    await prisma.$transaction(async (tx) => {
      // Update the user data with artist settings
      await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          name: data.name,
          email: data.email,
          yearsOfExperience: data.yearsOfExperience,
          bio: data.bio,
          instagram: data.instagram,
          facebook: data.facebook,
          twitter: data.twitter,
          tiktok: data.tiktok,
          website: data.website,
          defaultPrice: data.defaultPrice,
        },
      });

      // Update metadata for certificates and specialties
      await tx.userMetadata.upsert({
        where: {
          userId: user.id,
        },
        update: {
          artistSettings: JSON.stringify({
            certificates: data.certificates || [],
            specialties: data.specialties || [],
          }),
        },
        create: {
          userId: user.id,
          artistSettings: JSON.stringify({
            certificates: data.certificates || [],
            specialties: data.specialties || [],
          }),
        },
      });

      // Handle services
      if (data.services && data.services.length > 0) {
        // Get existing service IDs
        const existingServiceIds = artistUser.services.map(
          (service) => service.id
        );

        // Find services to delete (those in existingServiceIds but not in the incoming data.services)
        const incomingServiceIds = data.services
          .filter((service) => service.id)
          .map((service) => service.id as string);

        const serviceIdsToDelete = existingServiceIds.filter(
          (id) => !incomingServiceIds.includes(id)
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
        for (const service of data.services) {
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
              },
            });
          } else {
            // Create new service
            await tx.artistService.create({
              data: {
                name: service.name,
                description: service.description || "",
                price: service.price || 0,
                artistId: user.id,
              },
            });
          }
        }
      }
    });

    return NextResponse.json({
      message: "Artist settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating artist settings:", error);
    return NextResponse.json(
      { error: "Failed to update artist settings" },
      { status: 500 }
    );
  }
}
