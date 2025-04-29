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
  Filter,
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { db } from "@/lib/db";
import { CategoryFilter } from "./components/CategoryFilter";
import { ArtistsGrid } from "./components/ArtistsGrid";
import { MobileFilterToggle } from "./components/MobileFilterToggle";
import { CATEGORIES } from "./utils";

// تعريف واجهة الفنان
interface Artist {
  id: string;
  name: string | null;
  image: string | null;
  category: string;
  completedAppointments: number;
  isAvailable: boolean;
}

async function getArtists(category?: string) {
  // بناء شروط التصفية
  const where: any = {
    role: "ARTIST",
  };

  // إضافة فلتر الفئة إذا تم تحديده
  if (category && category !== "all") {
    where.category = category;
  }

  // الحصول على الفنانين مع البيانات الوصفية
  const artists = await db.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      category: true,
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
      category: artist.category || "",
      completedAppointments: artist._count.artistAppointments,
      isAvailable,
    };
  });
}

interface ArtistsPageProps {
  searchParams: { category?: string };
}

export default async function ArtistsPage({ searchParams }: ArtistsPageProps) {
  const category = searchParams.category || "all";
  const artists = await getArtists(category);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* عنوان الصفحة */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Browse through the makeup artists specialists.
        </h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* قائمة الفئات للتصفية - في الجانب */}
        <div className="hidden md:block md:w-64 flex-shrink-0">
          <div className="bg-white p-4 rounded-lg border border-gray-200 sticky top-4">
            <h2 className="font-semibold text-lg mb-4">Categories</h2>
            <CategoryFilter
              selectedCategory={category}
              categories={CATEGORIES}
            />
          </div>
        </div>

        {/* زر تبديل الفلاتر للشاشات الصغيرة */}
        <div className="md:hidden w-full">
          <MobileFilterToggle>
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
              <h2 className="font-semibold text-lg mb-4">Categories</h2>
              <CategoryFilter
                selectedCategory={category}
                categories={CATEGORIES}
              />
            </div>
          </MobileFilterToggle>
        </div>

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
