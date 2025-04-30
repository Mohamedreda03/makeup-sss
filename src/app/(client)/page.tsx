import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Heart,
  Star,
  Users,
  ShoppingCart,
  ShoppingBag,
} from "lucide-react";
import { db } from "@/lib/db";
import { CATEGORIES } from "./artists/utils";
import { formatPrice } from "@/lib/utils";

// تخصصات المكياج للعرض
const specialties = [
  {
    id: "bridal",
    name: "Bridal Makeup",
    image: "/images/specialty-bridal.jpg",
  },
  {
    id: "party",
    name: "Party Makeup",
    image: "/images/specialty-party.jpg",
  },
  {
    id: "editorial",
    name: "Editorial & Photoshoot",
    image: "/images/specialty-editorial.jpg",
  },
  {
    id: "henna",
    name: "Henna Night & Engagement",
    image: "/images/specialty-henna.jpg",
  },
];

// دالة للحصول على المنتجات المميزة
async function getFeaturedProducts() {
  try {
    const products = await db.product.findMany({
      where: {
        featured: true,
        inStock: true,
      },
      take: 4, // الحد الأقصى للمنتجات المميزة
      orderBy: {
        createdAt: "desc",
      },
    });

    return products;
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
}

// دالة للحصول على الفنانين المميزين
async function getFeaturedArtists() {
  try {
    const artists = await db.user.findMany({
      where: {
        role: "ARTIST",
      },
      take: 6, // الحد الأقصى للفنانين
      select: {
        id: true,
        name: true,
        image: true,
        category: true,
        // استخراج البيانات الوصفية للتحقق من التوفر
        metadata: {
          select: {
            availabilitySettings: true,
          },
        },
        // استخراج متوسط التقييمات
        reviews: {
          where: {
            status: "APPROVED", // فقط التقييمات المعتمدة
          },
          select: {
            rating: true,
          },
        },
      },
      orderBy: [
        { reviews: { _count: "desc" } }, // ترتيب حسب عدد التقييمات
        { createdAt: "desc" }, // ثم حسب تاريخ الإنشاء
      ],
    });

    // حساب متوسط التقييم لكل فنان
    return artists.map((artist: any) => {
      const totalRatings = artist.reviews.length;
      const sumRatings = artist.reviews.reduce(
        (sum: number, review: any) => sum + review.rating,
        0
      );
      const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

      // التحقق من توفر الفنان من البيانات الوصفية
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
        category: artist.category || "Makeup Artist",
        rating: averageRating,
        isAvailable: isAvailable,
      };
    });
  } catch (error) {
    console.error("Error fetching featured artists:", error);
    return [];
  }
}

export default async function HomePage() {
  // استدعاء دالة الحصول على الفنانين المميزين
  const featuredArtists = await getFeaturedArtists();

  // استدعاء دالة الحصول على المنتجات المميزة
  const featuredProducts = await getFeaturedProducts();

  return (
    <div className="flex flex-col min-h-screen">
      {/* قسم الحجز الرئيسي */}
      <section className="relative py-16 bg-gradient-to-br from-pink-50 to-rose-50">
        <div className="container mx-auto px-4 md:px-8 flex flex-col lg:flex-row items-center">
          <div className="w-full lg:w-1/2 mb-8 lg:mb-0 pr-0 lg:pr-8 z-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Book Appointment
              <br />
              With Trusted Makeup
              <br />
              Artists
            </h1>

            {/* Artist icons */}
            <div className="flex -space-x-3 mb-6">
              <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden">
                <Image
                  src="/images/artist-1.jpg"
                  alt="Makeup artist"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden">
                <Image
                  src="/images/artist-2.jpg"
                  alt="Makeup artist"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden">
                <Image
                  src="/images/artist-3.jpg"
                  alt="Makeup artist"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-white bg-pink-400 flex items-center justify-center text-white text-xs font-medium">
                +20
              </div>
            </div>

            <Button className="bg-white text-pink-500 hover:bg-gray-100 shadow-sm transition-all hover:shadow-md group">
              <Link href="/artists" className="flex items-center space-x-2">
                <span>Book Appointment</span>
                <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          <div className="w-full lg:w-1/2 relative">
            <div className="relative rounded-lg overflow-hidden shadow-xl">
              <Image
                src="/images/cta-makeup.jpg"
                alt="Makeup artist applying makeup"
                width={600}
                height={400}
                className="w-full h-auto object-cover rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute top-12 left-12 w-24 h-24 rounded-full bg-pink-200/30 blur-xl"></div>
        <div className="absolute bottom-12 right-12 w-32 h-32 rounded-full bg-rose-200/30 blur-xl"></div>
        <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full bg-pink-300/20 blur-lg"></div>
      </section>

      {/* قسم البحث حسب التخصص */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-semibold text-gray-800 text-center mb-8">
            Find by Speciality
          </h2>
          <p className="text-gray-600 text-center max-w-xl mx-auto mb-10">
            Simply browse through our extensive list of trusted Makeup Artists,
            wherever your appointment takes you.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {specialties.map((specialty) => (
              <Link
                href={`/artists?category=${specialty.id}`}
                key={specialty.id}
                className="flex flex-col items-center group"
              >
                <div className="w-32 h-32 rounded-full overflow-hidden mb-3 relative">
                  <Image
                    src={specialty.image}
                    alt={specialty.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <span className="text-sm text-gray-800 font-medium text-center">
                  {specialty.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* قسم المنتجات المميزة */}
      <section className="py-16 bg-gradient-to-br from-rose-50 to-pink-50 relative">
        {/* Decorative elements with pointer-events-none */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-rose-400/10 to-pink-500/10 z-0 pointer-events-none"></div>
        <div className="absolute top-1/4 right-1/3 w-48 h-48 rounded-full bg-rose-400/5 z-0 pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-pink-300/5 z-0 pointer-events-none"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
              Featured Beauty Products
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover our carefully selected premium makeup products, perfect
              for enhancing your natural beauty and creating stunning looks.
            </p>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product: any) => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl border border-rose-100 overflow-hidden shadow-md hover:shadow-xl transition-all group"
                >
                  <Link href={`/product/${product.id}`}>
                    <div className="relative h-52 overflow-hidden">
                      <Image
                        src={
                          product.imageUrl ||
                          "https://placehold.co/400x400/rose/white?text=No+Image"
                        }
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Featured
                      </div>
                    </div>
                  </Link>

                  <div className="p-4">
                    <Link
                      href={`/product/${product.id}`}
                      className="block hover:text-rose-600 transition-colors"
                    >
                      <h3 className="font-bold text-gray-800 mt-2 mb-1 line-clamp-1">
                        {product.name}
                      </h3>
                    </Link>

                    <div className="flex items-center justify-between mt-3">
                      <span className="font-bold text-lg bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
                        {formatPrice(product.price)}
                      </span>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white"
                        asChild
                      >
                        <Link href={`/product/${product.id}`}>
                          <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-xl shadow-sm">
              <p className="text-gray-500">
                No featured products available right now.
              </p>
            </div>
          )}

          <div className="flex justify-center mt-10">
            <Button
              variant="outline"
              className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-all group"
              asChild
            >
              <Link href="/products" className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 mr-1" />
                <span>Browse All Products</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* قسم فناني المكياج المميزين */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-semibold text-gray-800 text-center mb-8">
            Top Makeup Artists to Book
          </h2>
          <p className="text-gray-600 text-center max-w-xl mx-auto mb-10">
            Simply browse through our extensive list of trusted Makeup Artists.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredArtists.length > 0 ? (
              featuredArtists.map((artist: any) => (
                <Link
                  href={`/artists/${artist.id}`}
                  key={artist.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                >
                  <div className="relative h-48 w-full">
                    {artist.image ? (
                      <Image
                        src={artist.image}
                        alt={artist.name || "Artist"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
                        No image available
                      </div>
                    )}

                    {/* شارة توفر الفنان */}
                    <div className="absolute top-2 right-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          artist.isAvailable
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {artist.isAvailable ? "Available" : "Not Available"}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-xl">{artist.name}</h3>
                    <p className="text-base text-gray-500">{artist.category}</p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                No featured artists available at the moment.
              </div>
            )}
          </div>

          <div className="flex justify-center mt-10">
            <Button
              variant="outline"
              className="border-pink-300 text-pink-500 hover:bg-pink-50 hover:shadow-sm transition-all group px-6"
              asChild
            >
              <Link href="/artists" className="flex items-center gap-2">
                <span>View More</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* قسم تحفيزي للحجز مع مئات الفنانين */}
      <section className="my-10">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="bg-[#ffb5b5] rounded-lg overflow-hidden shadow-md">
            <div className="flex flex-col md:flex-row items-center">
              <div className="w-full md:w-1/2 p-6 sm:p-8 md:p-10">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                  Book Appointment
                  <br />
                  With 100+ Trusted Makeup
                  <br />
                  Artists
                </h2>
                <Button className="bg-white text-pink-500 hover:bg-white/90 mt-2 px-6 py-2 text-base shadow-sm hover:shadow transition-all group">
                  <Link href="/sign-up" className="flex items-center gap-2">
                    <span>Create account</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
              <div className="w-full md:w-1/2">
                <div className="relative h-full">
                  <Image
                    src="/images/cta-makeup.jpg"
                    alt="Makeup session"
                    width={600}
                    height={400}
                    className="w-full h-auto object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
