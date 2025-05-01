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

    // Get the URL to parse query parameters
    const url = new URL(request.url);
    // Get artistId from query params (for admin updates)
    const artistIdParam = url.searchParams.get("artistId");

    // Get the appropriate user ID - either the artist being updated (if admin) or the current user
    let targetUserId = user.id;

    // Only allow admins to update other artists' settings
    if (user.role !== "ARTIST" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only artists or admins can update these settings" },
        { status: 403 }
      );
    }

    // If this is an admin updating an artist
    if (user.role === "ADMIN" && artistIdParam) {
      targetUserId = artistIdParam;
      console.log(
        `Admin (${user.id}) updating artist settings for: ${targetUserId}`
      );
    } else if (user.role !== "ARTIST") {
      // If not admin with artistId or not an artist
      return NextResponse.json(
        { error: "Invalid permissions or missing artistId" },
        { status: 403 }
      );
    }

    // Parse the request body
    let body;
    try {
      body = await request.json();
      console.log("Artist settings update request body:", {
        ...body,
        services: body.services ? `(${body.services.length} services)` : "none",
      });
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Validate the request body against our schema
    const validationResult = artistSettingsSchema.safeParse(body);

    if (!validationResult.success) {
      console.error(
        "Validation errors in artist settings update:",
        validationResult.error.format()
      );
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
        id: targetUserId,
      },
      include: {
        services: true,
      },
    });

    if (!artistUser) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    try {
      // Start a transaction to update everything
      await prisma.$transaction(async (tx) => {
        // Prepare update data, ensuring no undefined values
        const userUpdateData = {
          name: data.name,
          email: data.email,
          yearsOfExperience:
            data.yearsOfExperience ?? artistUser.yearsOfExperience,
          bio: data.bio ?? artistUser.bio,
          instagram: data.instagram ?? artistUser.instagram,
          facebook: data.facebook ?? artistUser.facebook,
          twitter: data.twitter ?? artistUser.twitter,
          tiktok: data.tiktok ?? artistUser.tiktok,
          website: data.website ?? artistUser.website,
          defaultPrice: data.defaultPrice ?? artistUser.defaultPrice,
        };

        // Update the user data with artist settings
        await tx.user.update({
          where: {
            id: targetUserId,
          },
          data: userUpdateData,
        });

        // Update metadata for certificates and specialties
        await tx.userMetadata.upsert({
          where: {
            userId: targetUserId,
          },
          update: {
            artistSettings: JSON.stringify({
              certificates: data.certificates || [],
              specialties: data.specialties || [],
            }),
          },
          create: {
            userId: targetUserId,
            artistSettings: JSON.stringify({
              certificates: data.certificates || [],
              specialties: data.specialties || [],
            }),
          },
        });

        // Handle services
        if (data.services && data.services.length > 0) {
          console.log(
            `Processing ${data.services.length} services for artist ${targetUserId}`
          );

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
            console.log(
              `Deleting ${serviceIdsToDelete.length} services for artist ${targetUserId}`
            );
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
            try {
              // Format service data
              const serviceData = {
                name: service.name,
                description: service.description || "",
                price: typeof service.price === "number" ? service.price : 0,
                isActive: service.isActive ?? true,
              };

              if (service.id) {
                // Update existing service
                console.log(
                  `Updating service ${service.id} for artist ${targetUserId}`
                );
                await tx.artistService.update({
                  where: {
                    id: service.id,
                  },
                  data: serviceData,
                });
              } else {
                // Create new service
                console.log(`Creating new service for artist ${targetUserId}`);
                await tx.artistService.create({
                  data: {
                    ...serviceData,
                    artistId: targetUserId,
                  },
                });
              }

              // This ensures that any service added/updated in metadata is also in the database
              await syncMetadataServicesToDatabase(
                tx,
                targetUserId,
                data.services
              );
            } catch (serviceError) {
              console.error(`Error processing service:`, service, serviceError);
              // Continue processing other services
            }
          }
        }
      });

      return NextResponse.json({
        message: "Artist settings updated successfully",
      });
    } catch (dbError: any) {
      console.error("Database error updating artist settings:", dbError);
      return NextResponse.json(
        {
          error: "Database error",
          details: dbError.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error updating artist settings:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Failed to update artist settings",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

// Helper function to sync metadata services to database
async function syncMetadataServicesToDatabase(
  tx: any,
  artistId: string,
  metadataServices: any[]
) {
  try {
    // Get all existing database services for this artist
    const existingServices = await tx.artistService.findMany({
      where: { artistId: artistId },
    });

    // Create a map of existing service IDs to easily check if a service exists
    const existingServiceMap = new Map();
    existingServices.forEach((service: any) => {
      existingServiceMap.set(service.id, service);
    });

    // Create a map of service names to avoid duplicates
    const serviceNameMap = new Map();
    existingServices.forEach((service: any) => {
      serviceNameMap.set(service.name.toLowerCase(), service);
    });

    // Process each metadata service
    for (const metadataService of metadataServices) {
      // Skip services that already exist in the database by ID
      if (metadataService.id && existingServiceMap.has(metadataService.id)) {
        continue;
      }

      // Check if a service with this name already exists
      const lowerName = metadataService.name.toLowerCase();
      if (serviceNameMap.has(lowerName)) {
        continue;
      }

      // Create the service in the database
      const newService = await tx.artistService.create({
        data: {
          name: metadataService.name,
          description: metadataService.description || "",
          price:
            typeof metadataService.price === "number"
              ? metadataService.price
              : 0,
          isActive: metadataService.isActive ?? true,
          artistId: artistId,
        },
      });

      // Add to maps to prevent duplicates
      existingServiceMap.set(newService.id, newService);
      serviceNameMap.set(newService.name.toLowerCase(), newService);
    }

    return true;
  } catch (error) {
    console.error("Error syncing metadata services to database:", error);
    return false;
  }
}
