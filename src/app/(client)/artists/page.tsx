import { Suspense } from "react";
import { db } from "@/lib/db";
import { ArtistsGrid, SearchForm } from "./components";

// Force dynamic rendering to prevent build-time database queries
export const dynamic = "force-dynamic";

async function getArtists(searchQuery?: string) {
  try {
    // Build where condition for search
    const whereCondition = {
      role: "ARTIST" as const,
      makeup_artist: {
        isNot: null, // Only get users who have makeup_artist profile
      },
      ...(searchQuery && {
        name: {
          contains: searchQuery,
          mode: "insensitive" as const,
        },
      }),
    };

    const artists = await db.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        makeup_artist: {
          select: {
            id: true,
            availability: true,
            rating: true,
            experience_years: true,
            bio: true,
            pricing: true,
          },
        },
        _count: {
          select: {
            bookings: {
              where: {
                booking_status: "COMPLETED",
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }); // Process artists data to determine their availability
    return artists.map((artist) => {
      return {
        id: artist.id,
        name: artist.name,
        image: artist.image,
        completedAppointments: artist._count.bookings,
        isAvailable: artist.makeup_artist?.availability || false,
        rating: artist.makeup_artist?.rating || 0,
        experienceYears: artist.makeup_artist?.experience_years || undefined,
        bio: artist.makeup_artist?.bio || undefined,
        pricing: artist.makeup_artist?.pricing || undefined,
      };
    });
  } catch (error) {
    console.error("Error fetching artists:", error);
    // Return empty array if database is not available during build
    return [];
  }
}

interface ArtistsPageProps {
  searchParams: { search?: string };
}

export default async function ArtistsPage({ searchParams }: ArtistsPageProps) {
  const searchQuery = searchParams.search;
  const artists = await getArtists(searchQuery);
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Page title */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-gray-800 px-2">
          Browse through the makeup artists specialists.
        </h1>
        <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4">
          Find the perfect makeup artist for your special day
        </p>
      </div>

      {/* Search Form */}
      <div className="mb-6 sm:mb-8">
        <SearchForm initialValue={searchQuery} />
      </div>

      {/* Search Results Info */}
      {searchQuery && (
        <div className="mb-4 sm:mb-6 px-2">
          <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 sm:p-4">
            <p className="text-sm sm:text-base text-gray-700 text-center">
              {artists.length > 0
                ? `Found ${artists.length} artist${
                    artists.length !== 1 ? "s" : ""
                  } for "${searchQuery}"`
                : `No artists found for "${searchQuery}". Try a different search term.`}
            </p>
          </div>
        </div>
      )}

      {/* Artists Display */}
      <div className="w-full">
        <Suspense
          fallback={
            <div className="flex justify-center py-12 sm:py-16">
              <div className="flex flex-col items-center space-y-3">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-rose-500"></div>
                <p className="text-sm text-gray-500">Loading artists...</p>
              </div>
            </div>
          }
        >
          <ArtistsGrid artists={artists} />
        </Suspense>
      </div>
    </div>
  );
}
