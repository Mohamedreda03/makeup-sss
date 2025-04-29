"use client";

import React from "react";
import Image from "next/image";
import { format } from "date-fns";
import {
  Star,
  Calendar,
  Clock,
  MapPin,
  Instagram,
  Facebook,
  CheckCircle,
  Award,
  Twitter,
  Globe,
  ExternalLink,
  Share2,
  DollarSign,
  Sparkles,
  Clock3,
  Tag,
  Medal,
  Gem,
  Brush,
  Palette,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import BookingForm from "@/components/booking/BookingForm";
import { ReviewList } from "@/components/reviews/ReviewList";
import { ReviewData } from "@/components/reviews/ReviewCard";
import { StarRating } from "@/components/reviews/StarRating";
import dynamic from "next/dynamic";

// Import the PublicReviewForm component
const PublicReviewForm = dynamic(
  () =>
    import("@/components/reviews/PublicReviewForm").then(
      (mod) => mod.PublicReviewForm
    ),
  { ssr: false }
);

interface Appointment {
  id: string;
  serviceType: string;
  totalPrice: number;
  notes: string | null;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface Artist {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  phone: string | null;
  instagram: string | null;
  facebook: string | null;
  twitter: string | null;
  tiktok: string | null;
  website: string | null;
  bio: string | null;
  yearsOfExperience?: number | null;
  defaultPrice?: number | null;
  category?: string;
  _count: {
    artistAppointments: number;
  };
  artistAppointments: Appointment[];
  metadata?: {
    id: string;
    availabilitySettings: string | null;
    artistSettings: string | null;
    preferences: string | null;
  } | null;
  averageRating?: number | null;
  totalReviews?: number | null;
}

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

interface ArtistClientPageProps {
  artist: Artist;
  services: Service[];
  isUserLoggedIn: boolean;
  bookingComponent?: React.ReactNode;
  reviewsComponent?: React.ReactNode;
}

const TiktokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4c0 1.1.9 2 2 2h2" />
  </svg>
);

export default function ArtistClientPage({
  artist,
  services,
  isUserLoggedIn,
  children,
  bookingComponent,
  reviewsComponent,
}: ArtistClientPageProps & { children?: React.ReactNode }) {
  // Check if artist has any social media links
  const hasSocialMedia =
    artist.instagram ||
    artist.facebook ||
    artist.twitter ||
    artist.tiktok ||
    artist.website;

  // Parse artist settings if available
  const artistSettings = artist.metadata?.artistSettings
    ? JSON.parse(artist.metadata.artistSettings)
    : null;

  // Use fixed specialties instead of dynamic ones
  const fixedSpecialties = [
    "Bridal Makeup",
    "Party Makeup",
    "Editorial & Photoshoot",
    "Henna Night & Engagement",
    "Bridal & Reception",
    "Photoshoot Makeup",
    "Runway & Fashion Show",
  ];

  // Check if artist has specialties or certificates
  const hasSpecialties = true; // Always show fixed categories
  const hasCertificates = artistSettings?.certificates?.length > 0;

  // Check if reviews component exists
  const hasReviewsComponent = !!reviewsComponent;

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Artist Profile Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="md:col-span-1">
          <div className="relative rounded-lg overflow-hidden w-full h-80 md:h-full shadow-lg">
            {artist.image ? (
              <Image
                src={artist.image}
                alt={artist.name || "Artist"}
                fill
                unoptimized={true}
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
                No image available
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-3xl font-bold">{artist.name}</h1>
            {artist.averageRating ? (
              <div className="flex items-center gap-2 bg-rose-50 px-3 py-1.5 rounded-full">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-rose-500 fill-rose-500" />
                  <span className="ml-1 text-lg font-semibold text-rose-700">
                    {artist.averageRating.toFixed(1)}
                  </span>
                </div>
                <span className="text-sm text-rose-600">
                  ({artist.totalReviews}{" "}
                  {artist.totalReviews === 1 ? "review" : "reviews"})
                </span>
              </div>
            ) : (
              <Badge variant="outline" className="text-gray-500">
                New Artist
              </Badge>
            )}
          </div>
          <p className="text-gray-500 mb-4">Professional Makeup Artist</p>

          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <Badge variant="secondary" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Verified Professional
            </Badge>

            {/* Display first two specialties */}
            {artist.category && (
              <Badge
                variant="outline"
                className="bg-rose-50 text-rose-700 border-rose-200"
              >
                {artist.category}
              </Badge>
            )}
          </div>

          {artist.defaultPrice && (
            <div className="flex items-center gap-2 text-2xl font-bold mb-4">
              <span>EGP</span>
              <span>{artist.defaultPrice}</span>
            </div>
          )}

          {/* Artist bio */}
          <div className="mb-6">
            <p className="text-gray-700 italic relative pl-6">{artist.bio}</p>
          </div>

          {/* Artist info cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            {/* Contact info card */}
            <div className="">
              <CardContent className="space-y-2 text-sm">
                {artist.email && (
                  <p className="flex items-center">
                    <span className="font-medium w-20">Email:</span>
                    <span className="text-gray-700">{artist.email}</span>
                  </p>
                )}
                {artist.phone && (
                  <p className="flex items-center">
                    <span className="font-medium w-20">Phone:</span>
                    <span className="text-gray-700">{artist.phone}</span>
                  </p>
                )}
                {artist.website && (
                  <p className="flex items-center">
                    <span className="font-medium w-20">Website:</span>
                    <a
                      href={
                        artist.website.startsWith("http")
                          ? artist.website
                          : `https://${artist.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-rose-500 hover:underline flex items-center"
                    >
                      {artist.website} <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </p>
                )}
              </CardContent>
            </div>
          </div>

          {children}

          {hasSocialMedia && (
            <div className="flex gap-4">
              {artist.instagram && (
                <Button variant="outline" size="icon" asChild>
                  <a
                    href={
                      artist.instagram.startsWith("http")
                        ? artist.instagram
                        : `https://instagram.com/${artist.instagram.replace(
                            "@",
                            ""
                          )}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {artist.facebook && (
                <Button variant="outline" size="icon" asChild>
                  <a
                    href={
                      artist.facebook.startsWith("http")
                        ? artist.facebook
                        : `https://facebook.com/${artist.facebook}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {artist.twitter && (
                <Button variant="outline" size="icon" asChild>
                  <a
                    href={
                      artist.twitter.startsWith("http")
                        ? artist.twitter
                        : `https://twitter.com/${artist.twitter.replace(
                            "@",
                            ""
                          )}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter"
                  >
                    <Twitter className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {artist.tiktok && (
                <Button variant="outline" size="icon" asChild>
                  <a
                    href={
                      artist.tiktok.startsWith("http")
                        ? artist.tiktok
                        : `https://tiktok.com/@${artist.tiktok.replace(
                            "@",
                            ""
                          )}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="TikTok"
                  >
                    <TiktokIcon className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {artist.website && (
                <Button variant="outline" size="icon" asChild>
                  <a
                    href={
                      artist.website.startsWith("http")
                        ? artist.website
                        : `https://${artist.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Website"
                  >
                    <Globe className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <Separator className="my-8" />

      {/* Booking Tabs */}
      <Tabs defaultValue="services" className="mb-12">
        <TabsList className="mb-6">
          <TabsTrigger value="services" id="services-tab">
            Services & Booking
          </TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="services">
          <div className="w-full">
            {bookingComponent ? (
              bookingComponent
            ) : (
              <BookingForm
                artistId={artist.id}
                services={services}
                isUserLoggedIn={isUserLoggedIn}
                defaultPrice={artist.defaultPrice || 0}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="reviews">
          <div className="space-y-8">
            {/* Review Form Section - Only show to logged in users */}
            {isUserLoggedIn && (
              <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-100">
                <h3 className="text-xl font-semibold mb-4">Rate this artist</h3>
                <PublicReviewForm
                  artistId={artist.id}
                  artistName={artist.name || ""}
                />
              </div>
            )}

            {/* Reviews List Section */}
            {reviewsComponent ? (
              reviewsComponent
            ) : (
              <Card className="border-dashed border-gray-200 bg-gray-50">
                <CardContent className="p-12 text-center text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Star className="h-8 w-8 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No reviews yet
                  </h3>
                  <p>This artist doesn't have any reviews at the moment.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
