import { Suspense } from "react";
import { db } from "@/lib/db";
import { ArtistsGrid } from "./components/ArtistsGrid";

// Force dynamic rendering to prevent build-time database queries
export const dynamic = "force-dynamic";

async function getArtists() {
  try {
    // الحصول على الفنانين مع البيانات الوصفية
    const artists = await db.user.findMany({
      where: {
        role: "ARTIST",
        makeup_artist: {
          isNot: null, // Only get users who have makeup_artist profile
        },
      },
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
        // عدد الجلسات المكتملة لكل فنان
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
    });

    // معالجة بيانات الفنانين لتحديد توفرهم
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

export default async function ArtistsPage() {
  const artists = await getArtists();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* عنوان الصفحة */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Browse through the makeup artists specialists.
        </h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* عرض الفنانين */}
        <div className="flex-1">
          <Suspense
            fallback={
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
              </div>
            }
          >
            <ArtistsGrid artists={artists} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
