import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Calendar,
  Clock,
  MapPin,
  Instagram,
  Facebook,
  Twitter,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { db } from "@/lib/db";
import { ArtistsGrid } from "./components/ArtistsGrid";

// تعريف واجهة الفنان
interface Artist {
  id: string;
  name: string | null;
  image: string | null;
  completedAppointments: number;
  isAvailable: boolean;
}

async function getArtists() {
  // بناء شروط التصفية
  const where: any = {
    role: "ARTIST",
  };

  // الحصول على الفنانين مع البيانات الوصفية
  const artists = await db.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      metadata: {
        select: {
          availabilitySettings: true,
        },
      },
      // عدد الجلسات المكتملة لكل فنان
      _count: {
        select: {
          artistAppointments: {
            where: {
              status: "COMPLETED",
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
  return artists.map((artist: any) => {
    // التحقق من التوفر من البيانات الوصفية
    let isAvailable = true;

    if (artist.metadata?.availabilitySettings) {
      try {
        const settings = JSON.parse(artist.metadata.availabilitySettings);
        if (settings.isAvailable !== undefined) {
          isAvailable = settings.isAvailable;
        }
      } catch (error) {
        console.error("Error parsing availability settings:", error);
      }
    }

    return {
      id: artist.id,
      name: artist.name,
      image: artist.image,
      completedAppointments: artist._count.artistAppointments,
      isAvailable,
    };
  });
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
