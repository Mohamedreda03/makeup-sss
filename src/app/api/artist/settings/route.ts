import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
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

    // Fetch the artist data from the database
    const artistUser = await db.user.findUnique({
      where: {
        id: user.id,
      },
      include: {
        makeup_artist: true,
        services: true,
      },
    });

    if (!artistUser) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    // Transform the artist data to match our schema
    const artistSettings = {
      name: artistUser.name,
      email: artistUser.email,
      image: artistUser.image,
      phone: artistUser.phone,
      address: artistUser.address,
      bio: artistUser.makeup_artist?.bio,
      experience_years: artistUser.makeup_artist?.experience_years,
      portfolio: artistUser.makeup_artist?.portfolio,
      gender: artistUser.makeup_artist?.gender,
      pricing: artistUser.makeup_artist?.pricing,
      availability: artistUser.makeup_artist?.availability,
      earnings: artistUser.makeup_artist?.earnings || 0,
      rating: artistUser.makeup_artist?.rating,
      services: artistUser.services,
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
    const artistUser = await db.user.findUnique({
      where: {
        id: targetUserId,
      },
      include: {
        makeup_artist: true,
        services: true,
      },
    });

    if (!artistUser) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    try {
      // Start a transaction to update everything
      await db.$transaction(async (tx) => {
        // Update the user data
        const userUpdateData: { [key: string]: string | null } = {};
        if (data.name) userUpdateData.name = data.name;
        if (data.email) userUpdateData.email = data.email;
        if (data.phone !== undefined) userUpdateData.phone = data.phone;
        if (data.address !== undefined) userUpdateData.address = data.address;
        if (data.image !== undefined) userUpdateData.image = data.image;

        if (Object.keys(userUpdateData).length > 0) {
          await tx.user.update({
            where: {
              id: targetUserId,
            },
            data: userUpdateData,
          });
        } // Update or create MakeUpArtist record
        const artistUpdateData: {
          [key: string]: string | number | boolean | null;
        } = {};
        if (data.bio !== undefined) artistUpdateData.bio = data.bio;
        if (data.experience_years !== undefined)
          artistUpdateData.experience_years = data.experience_years;
        if (data.portfolio !== undefined)
          artistUpdateData.portfolio = data.portfolio;
        if (data.gender !== undefined) artistUpdateData.gender = data.gender;
        if (data.pricing !== undefined) artistUpdateData.pricing = data.pricing;
        if (data.availability !== undefined)
          artistUpdateData.availability = data.availability;

        if (Object.keys(artistUpdateData).length > 0) {
          await tx.makeUpArtist.upsert({
            where: {
              user_id: targetUserId,
            },
            update: artistUpdateData,
            create: {
              user_id: targetUserId,
              ...artistUpdateData,
            },
          });
        }

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
    } catch (dbError: unknown) {
      console.error("Database error updating artist settings:", dbError);
      return NextResponse.json(
        {
          error: "Database error",
          details:
            dbError instanceof Error
              ? dbError.message
              : "Unknown database error",
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
