import { Award } from "lucide-react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import ArtistClientPage from "@/components/artists/ArtistClientPage";
import dynamicImport from "next/dynamic";
import { ReviewList } from "@/components/reviews/ReviewList";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";

// Initialize dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

// Force dynamic rendering to prevent build-time database queries
export const dynamic = "force-dynamic";

// Dynamically import ArtistBooking with no SSR
const ArtistBookingWrapper = dynamicImport(
  () => import("@/components/booking/ArtistBookingWrapper"),
  { ssr: false }
);

// Get artist data by ID
async function getArtist(id: string) {
  try {
    const artist = await db.user.findUnique({
      where: {
        id,
        role: "ARTIST",
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        address: true,
        makeup_artist: {
          select: {
            id: true,
            bio: true,
            experience_years: true,
            pricing: true,
            portfolio: true,
            rating: true,
            availability: true,
            available_slots: true,
            // Social media links
            instagram_url: true,
            facebook_url: true,
            twitter_url: true,
            tiktok_url: true,
            youtube_url: true,
          },
        },
        // Count completed bookings
        _count: {
          select: {
            bookings: {
              where: {
                booking_status: "COMPLETED",
              },
            },
          },
        },
        // Get recent bookings
        bookings: {
          where: {
            booking_status: "COMPLETED",
          },
          orderBy: {
            updatedAt: "desc",
          },
          take: 5,
          select: {
            id: true,
            service_type: true,
            service_price: true,
            date_time: true,
            updatedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return artist;
  } catch (error) {
    console.error("Error fetching artist:", error);
    // Return null if database is not available during build
    return null;
  }
}

// Get artist services from database
async function getArtistServices(id: string) {
  try {
    const databaseServices = await db.artistService.findMany({
      where: {
        artistId: id,
        isActive: true,
      },
      orderBy: {
        price: "asc",
      },
    });

    // Format database services with needed properties
    const formattedDatabaseServices = databaseServices.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description || "",
      price: service.price,
      duration: service.duration || 60,
      isActive: service.isActive,
      artistId: service.artistId,
    }));

    // If we found database services, return them
    if (formattedDatabaseServices.length > 0) {
      return formattedDatabaseServices;
    }

    // Default services if none are found
    return [
      {
        id: "default-1",
        name: "Bridal Makeup",
        description: "Complete bridal makeup with trials and day-of services",
        price: 250,
        duration: 120,
        isActive: true,
        artistId: id,
      },
      {
        id: "default-2",
        name: "Special Occasion Makeup",
        description: "Perfect for parties, events, or photoshoots",
        price: 150,
        duration: 90,
        isActive: true,
        artistId: id,
      },
    ];
  } catch (error) {
    console.error("Error fetching artist services:", error);
    // Return default services if database is not available during build
    return [
      {
        id: "default-1",
        name: "Bridal Makeup",
        description: "Complete bridal makeup with trials and day-of services",
        price: 250,
        duration: 120,
        isActive: true,
        artistId: id,
      },
      {
        id: "default-2",
        name: "Special Occasion Makeup",
        description: "Perfect for parties, events, or photoshoots",
        price: 150,
        duration: 90,
        isActive: true,
        artistId: id,
      },
    ];
  }
}

// Get availability settings for the artist with booking data
async function getArtistAvailabilitySettings(id: string) {
  try {
    // Get artist data and makeup artist profile
    const artist = await db.user.findUnique({
      where: {
        id,
        role: "ARTIST",
      },
      select: {
        makeup_artist: {
          select: {
            id: true,
            available_slots: true,
          },
        },
      },
    });

    // Get existing bookings for the artist
    const existingBookings = artist?.makeup_artist?.id
      ? await db.booking.findMany({
          where: {
            artist_id: artist.makeup_artist.id,
            booking_status: {
              in: ["PENDING", "CONFIRMED"], // Only confirmed and pending bookings
            },
            date_time: {
              gte: new Date(), // Only future bookings
            },
          },
          select: {
            id: true,
            date_time: true,
            service_type: true,
            booking_status: true,
          },
        })
      : [];

    // Default settings that match AvailabilitySettings interface
    const defaultAvailabilitySettings = {
      isAvailable: true,
      workingHours: {
        start: 9,
        end: 18,
        interval: 60,
      },
      regularDaysOff: [0, 6], // Sunday and Saturday
      bookedSlots: existingBookings.map((booking) => {
        // Convert date and time to Cairo timezone with accuracy guarantee
        const bookingDateTime = dayjs(booking.date_time).tz("Africa/Cairo");

        return {
          date: bookingDateTime.format("YYYY-MM-DD"), // Date in Egypt timezone
          time: bookingDateTime.format("HH:mm"), // Time in Egypt timezone (24 hour format)
          booking_id: booking.id,
          service_type: booking.service_type,
          status: booking.booking_status,
        };
      }),
    };

    if (!artist?.makeup_artist?.available_slots) {
      return defaultAvailabilitySettings;
    }

    try {
      const availableSlots = artist.makeup_artist.available_slots as {
        workingDays?: number[];
        startTime?: string;
        endTime?: string;
        sessionDuration?: number;
        breakBetweenSessions?: number;
        isAvailable?: boolean;
      };

      // Convert workingDays to regularDaysOff
      let regularDaysOff = [0, 6]; // Default to Sunday and Saturday off
      if (
        availableSlots.workingDays &&
        Array.isArray(availableSlots.workingDays)
      ) {
        const allDays = [0, 1, 2, 3, 4, 5, 6]; // Sunday=0 to Saturday=6
        regularDaysOff = allDays.filter(
          (day) => !availableSlots.workingDays!.includes(day)
        );
      }

      // Use dayjs to handle start and end times in Egypt timezone
      const startTime = availableSlots.startTime
        ? dayjs
            .tz(`2000-01-01T${availableSlots.startTime}`, "Africa/Cairo")
            .hour()
        : 9;

      const endTime = availableSlots.endTime
        ? dayjs
            .tz(`2000-01-01T${availableSlots.endTime}`, "Africa/Cairo")
            .hour()
        : 18;

      const settings = {
        isAvailable: availableSlots.isAvailable ?? true,
        workingHours: {
          start: startTime,
          end: endTime,
          interval: availableSlots.sessionDuration || 60,
        },
        regularDaysOff,
        bookedSlots: existingBookings.map((booking) => {
          // Convert date and time to Cairo timezone with accuracy guarantee
          const bookingDateTime = dayjs(booking.date_time).tz("Africa/Cairo");

          return {
            date: bookingDateTime.format("YYYY-MM-DD"), // Date in Egypt timezone
            time: bookingDateTime.format("HH:mm"), // Time in Egypt timezone (24 hour format)
            booking_id: booking.id,
            service_type: booking.service_type,
            status: booking.booking_status,
          };
        }),
      };

      return settings;
    } catch (error) {
      console.error("Error parsing artist availability settings:", error);
      return defaultAvailabilitySettings;
    }
  } catch (error) {
    console.error(
      "Error fetching artist availability settings - database may be unavailable during build:",
      error
    );
    // Return default settings if database is not available during build
    return {
      isAvailable: true,
      workingHours: {
        start: 9,
        end: 18,
        interval: 60,
      },
      regularDaysOff: [0, 6], // Sunday and Saturday
      bookedSlots: [],
    };
  }
}

// Get artist reviews
async function getArtistReviews(id: string) {
  try {
    // Get the makeup artist first
    const makeupArtist = await db.makeUpArtist.findFirst({
      where: {
        user_id: id,
      },
      select: {
        id: true,
      },
    });

    if (!makeupArtist) {
      return [];
    }

    // Get reviews for this makeup artist
    const reviews = await db.review.findMany({
      where: {
        artist_id: makeupArtist.id,
        status: "APPROVED",
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return reviews;
  } catch (error) {
    console.error(
      "Error fetching artist reviews - database may be unavailable during build:",
      error
    );
    // Return empty array if database is not available during build
    return [];
  }
}

// Get metadata for the page
export async function generateMetadata({ params }: { params: { id: string } }) {
  const artist = await getArtist(params.id);

  if (!artist) {
    return {
      title: "Artist Not Found",
      description: "The artist you are looking for does not exist",
    };
  }

  return {
    title: `${artist.name} - Book Makeup Services`,
    description: `Book a makeup session with ${artist.name}. Professional makeup services for any occasion.`,
  };
}

export default async function ArtistPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  const artist = await getArtist(params.id);

  console.log("Artist data:", artist?.makeup_artist);

  if (!artist) {
    notFound();
  }

  // Get artist reviews and calculate ratings
  const reviews = await getArtistReviews(params.id);

  // Make sure we only include approved reviews
  const approvedReviews = reviews.filter(
    (review) => review.status === "APPROVED"
  );

  // Calculate average rating from approved reviews
  const averageRating =
    approvedReviews.length > 0
      ? approvedReviews.reduce(
          (sum: number, review) => sum + review.rating,
          0
        ) / approvedReviews.length
      : artist.makeup_artist?.rating || null;

  const totalReviews = approvedReviews.length;

  // Get real services from database
  const services = await getArtistServices(params.id);

  // Get artist availability settings
  const availabilitySettings = await getArtistAvailabilitySettings(params.id);

  // Format reviews for the ReviewList component
  const formattedReviews = approvedReviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    status: review.status,
    createdAt: review.createdAt.toISOString(),
    user: {
      id: review.user.id,
      name: review.user.name,
      image: review.user.image,
    },
    appointment: {
      serviceType: "Makeup Service",
      datetime: review.createdAt.toISOString(),
    },
  }));

  // Check if user is logged in
  const isUserLoggedIn = !!session?.user;

  const artistData = {
    id: artist.id,
    name: artist.name,
    email: artist.email,
    image: artist.image,
    phone: artist.phone,
    portfolio: artist.makeup_artist?.portfolio || null,
    bio: artist.makeup_artist?.bio || "",
    yearsOfExperience:
      typeof artist.makeup_artist?.experience_years === "string"
        ? parseInt(artist.makeup_artist.experience_years) || 0
        : artist.makeup_artist?.experience_years || 0,
    defaultPrice: artist.makeup_artist?.pricing || 100,
    // Social media links
    socialMedia: {
      instagram: artist.makeup_artist?.instagram_url || null,
      facebook: artist.makeup_artist?.facebook_url || null,
      twitter: artist.makeup_artist?.twitter_url || null,
      tiktok: artist.makeup_artist?.tiktok_url || null,
      youtube: artist.makeup_artist?.youtube_url || null,
    },
    _count: {
      artistAppointments: artist._count.bookings,
    },
    artistAppointments: artist.bookings.map((booking) => ({
      id: booking.id,
      serviceType: booking.service_type,
      totalPrice: booking.service_price || 0,
      notes: null,
      updatedAt: booking.updatedAt.toISOString(),
      user: {
        id: booking.user.id,
        name: booking.user.name,
        image: booking.user.image,
      },
    })),
    metadata: null,
    averageRating: averageRating,
    totalReviews: totalReviews,
  };

  return (
    <main>
      <ArtistClientPage
        artist={artistData}
        services={services}
        isUserLoggedIn={isUserLoggedIn}
        bookingComponent={
          <ArtistBookingWrapper
            artistId={params.id}
            services={services}
            isUserLoggedIn={isUserLoggedIn}
            availabilitySettings={availabilitySettings}
          />
        }
        reviewsComponent={
          <ReviewList
            artistId={params.id}
            initialReviews={formattedReviews}
            variant="artist"
          />
        }
      >
        {/* Experience years display */}
        {artist.makeup_artist?.experience_years && (
          <div className="flex items-center gap-1 mb-6 text-gray-600 bg-purple-50 border border-purple-100 rounded-lg p-3">
            <Award className="h-5 w-5 text-purple-500" />
            <span className="font-medium">
              {artist.makeup_artist.experience_years} years of professional
              makeup experience
            </span>
          </div>
        )}
      </ArtistClientPage>
    </main>
  );
}
