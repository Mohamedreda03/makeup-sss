import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, CheckCircle, Clock } from "lucide-react";

interface Artist {
  id: string;
  name: string | null;
  image: string | null;
  completedAppointments: number;
  isAvailable: boolean;
  rating?: number;
  experienceYears?: string;
  bio?: string;
  pricing?: number;
}

interface ArtistsGridProps {
  artists: Artist[];
}

export function ArtistsGrid({ artists }: ArtistsGridProps) {
  if (artists.length === 0) {
    return (
      <div className="text-center py-12 sm:py-16">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg sm:text-xl font-medium text-gray-900">
              No artists found
            </h3>
            <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto px-4">
              Try adjusting your search criteria or browse all available artists
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {artists.map((artist) => (
        <Link href={`/artists/${artist.id}`} key={artist.id} className="group">
          <Card className="overflow-hidden border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-200 group-hover:-translate-y-1">
            <div className="relative h-48 sm:h-56 lg:h-64 bg-gray-50">
              {artist.image ? (
                <Image
                  src={artist.image}
                  alt={artist.name || "Artist"}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gradient-to-br from-pink-50 to-purple-50">
                  <div className="text-center">
                    <svg
                      className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <p className="text-xs sm:text-sm text-gray-400">No image</p>
                  </div>
                </div>
              )}
              {/* Availability Badge */}
              <div className="absolute top-3 right-3">
                <Badge
                  variant={artist.isAvailable ? "default" : "secondary"}
                  className={`text-xs px-2 py-1 ${
                    artist.isAvailable
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "bg-gray-500 hover:bg-gray-600 text-white"
                  }`}
                >
                  {artist.isAvailable ? (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  ) : (
                    <Clock className="w-3 h-3 mr-1" />
                  )}
                  {artist.isAvailable ? "Available" : "Busy"}
                </Badge>
              </div>
            </div>
            <CardContent className="p-3 sm:p-4">
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-1 group-hover:text-pink-600 transition-colors">
                    {artist.name || "Unknown Artist"}
                  </h3>
                  {artist.experienceYears && (
                    <p className="text-xs sm:text-sm text-gray-500">
                      {artist.experienceYears} experience
                    </p>
                  )}
                </div>

                {/* Rating and Stats */}
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                    <span className="text-gray-600">
                      {artist.rating ? artist.rating.toFixed(1) : "New"}
                    </span>
                  </div>
                  <div className="text-gray-500">
                    {artist.completedAppointments} appointments
                  </div>
                </div>

                {/* Bio Preview */}
                {artist.bio && (
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                    {artist.bio}
                  </p>
                )}

                {/* Pricing */}
                {artist.pricing && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-xs sm:text-sm text-gray-500">
                      Starting from
                    </span>
                    <span className="text-sm sm:text-base font-semibold text-pink-600">
                      ${artist.pricing}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
