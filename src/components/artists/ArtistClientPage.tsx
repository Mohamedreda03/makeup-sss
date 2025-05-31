"use client";

import React from "react";
import Image from "next/image";

import {
  Star,
  Calendar,
  CheckCircle,
  Globe,
  ExternalLink,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import BookingForm from "@/components/booking/BookingForm";
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
  portfolio: string | null;
  bio: string | null;
  yearsOfExperience?: number | null;
  defaultPrice?: number | null;
  socialMedia?: {
    instagram?: string | null;
    facebook?: string | null;
    twitter?: string | null;
    tiktok?: string | null;
    youtube?: string | null;
  };
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

export default function ArtistClientPage({
  artist,
  services,
  isUserLoggedIn,
  children,
  bookingComponent,
  reviewsComponent,
}: ArtistClientPageProps & { children?: React.ReactNode }) {
  // Check if artist has website
  const hasWebsite = artist.portfolio;

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
          </div>

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
                {artist.portfolio && (
                  <p className="flex items-center">
                    <span className="font-medium w-20">Website:</span>
                    <a
                      href={
                        artist.portfolio.startsWith("http")
                          ? artist.portfolio
                          : `https://${artist.portfolio}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-rose-500 hover:underline flex items-center"
                    >
                      {artist.portfolio}{" "}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </p>
                )}
              </CardContent>
            </div>

            {/* Social Media links */}
            {artist.socialMedia &&
              (artist.socialMedia.instagram ||
                artist.socialMedia.facebook ||
                artist.socialMedia.twitter ||
                artist.socialMedia.tiktok ||
                artist.socialMedia.youtube) && (
                <div className="">
                  <CardContent className="space-y-3">
                    <h4 className="font-medium text-sm text-gray-900 mb-2">
                      Follow on Social Media:
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {artist.socialMedia.instagram && (
                        <a
                          href={
                            artist.socialMedia.instagram.startsWith("http")
                              ? artist.socialMedia.instagram
                              : `https://instagram.com/${artist.socialMedia.instagram.replace(
                                  "@",
                                  ""
                                )}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xs hover:shadow-md transition-shadow"
                        >
                          <Instagram className="h-3 w-3" />
                          Instagram
                        </a>
                      )}
                      {artist.socialMedia.facebook && (
                        <a
                          href={
                            artist.socialMedia.facebook.startsWith("http")
                              ? artist.socialMedia.facebook
                              : `https://facebook.com/${artist.socialMedia.facebook}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-full text-xs hover:shadow-md transition-shadow"
                        >
                          <Facebook className="h-3 w-3" />
                          Facebook
                        </a>
                      )}
                      {artist.socialMedia.twitter && (
                        <a
                          href={
                            artist.socialMedia.twitter.startsWith("http")
                              ? artist.socialMedia.twitter
                              : `https://twitter.com/${artist.socialMedia.twitter.replace(
                                  "@",
                                  ""
                                )}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 bg-sky-500 text-white rounded-full text-xs hover:shadow-md transition-shadow"
                        >
                          <Twitter className="h-3 w-3" />
                          Twitter
                        </a>
                      )}
                      {artist.socialMedia.tiktok && (
                        <a
                          href={
                            artist.socialMedia.tiktok.startsWith("http")
                              ? artist.socialMedia.tiktok
                              : `https://tiktok.com/@${artist.socialMedia.tiktok.replace(
                                  "@",
                                  ""
                                )}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-full text-xs hover:shadow-md transition-shadow"
                        >
                          <svg
                            className="h-3 w-3"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                          </svg>
                          TikTok
                        </a>
                      )}
                      {artist.socialMedia.youtube && (
                        <a
                          href={
                            artist.socialMedia.youtube.startsWith("http")
                              ? artist.socialMedia.youtube
                              : `https://youtube.com/@${artist.socialMedia.youtube.replace(
                                  "@",
                                  ""
                                )}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-full text-xs hover:shadow-md transition-shadow"
                        >
                          <Youtube className="h-3 w-3" />
                          YouTube
                        </a>
                      )}
                    </div>
                  </CardContent>
                </div>
              )}
          </div>

          {children}

          {hasWebsite && artist.portfolio && (
            <div className="flex gap-4">
              <Button variant="outline" size="sm" asChild>
                <a
                  href={
                    artist.portfolio.startsWith("http")
                      ? artist.portfolio
                      : `https://${artist.portfolio}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Website"
                  className="flex items-center gap-2"
                >
                  <Globe className="h-4 w-4" />
                  Visit Website
                </a>
              </Button>
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
            {!isUserLoggedIn ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-amber-100 rounded-full p-3">
                    <Calendar className="h-6 w-6 text-amber-700" />
                  </div>
                  <h3 className="text-xl font-semibold text-amber-800">
                    Sign in required
                  </h3>
                  <p className="text-amber-700 max-w-md mx-auto mb-2">
                    Please sign in or create an account to book an appointment
                    with this artist.
                  </p>
                  <div className="flex gap-4 mt-2">
                    <Button asChild className="bg-amber-600 hover:bg-amber-700">
                      <a href="/sign-in">Sign In</a>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="border-amber-200 text-amber-700 hover:bg-amber-100"
                    >
                      <a href="/sign-up">Create Account</a>
                    </Button>
                  </div>
                </div>
              </div>
            ) : bookingComponent ? (
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
