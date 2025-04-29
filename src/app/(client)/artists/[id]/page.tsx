import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Star,
  Calendar,
  Clock,
  MapPin,
  Instagram,
  Facebook,
  Twitter,
  ArrowRight,
  Check,
  ArrowLeft,
  Heart,
  Award,
  CheckCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ArtistClientPage from "@/components/artists/ArtistClientPage";
import dynamic from "next/dynamic";
import { ReviewList } from "@/components/reviews/ReviewList";

// Import the PublicReviewForm component
const PublicReviewForm = dynamic(
  () =>
    import("@/components/reviews/PublicReviewForm").then(
      (mod) => mod.PublicReviewForm
    ),
  { ssr: false }
);

// Dynamically import ArtistBooking with no SSR
const ArtistBookingWrapper = dynamic(
  () => import("@/components/booking/ArtistBookingWrapper"),
  { ssr: false }
);

// Sample artists data - in production, fetch from API
const artists = [
  {
    id: "1",
    name: "Sophia Williams",
    role: "Professional Makeup Artist",
    bio: "Professional makeup artist with over 10 years of experience in bridal and fashion makeup. Sophia specializes in creating flawless, natural looks that enhance your features while ensuring your makeup lasts all day. Her attention to detail and personalized approach means every client receives a custom look tailored to their unique style and preferences.",
    specialties: ["Bridal", "Fashion", "Natural Look"],
    rating: 4.9,
    reviewCount: 189,
    yearsExperience: 10,
    location: "New York City",
    imageUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    socialMedia: {
      instagram: "#",
      facebook: "#",
      twitter: "#",
    },
    portfolio: [
      {
        id: "p1",
        title: "Bridal Elegance",
        imageUrl:
          "https://images.unsplash.com/photo-1600091166971-7f9fadd2bc07?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        category: "Bridal",
      },
      {
        id: "p2",
        title: "Fashion Week Glamour",
        imageUrl:
          "https://images.unsplash.com/photo-1588558352342-bbd9654633cf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        category: "Fashion",
      },
      {
        id: "p3",
        title: "Natural Daytime Look",
        imageUrl:
          "https://images.unsplash.com/photo-1613967193490-1a58d868586k?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        category: "Natural",
      },
      {
        id: "p4",
        title: "Editorial Shoot",
        imageUrl:
          "https://images.unsplash.com/photo-1549411037-2af0bf8cfe31?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
        category: "Editorial",
      },
    ],
    services: [
      {
        id: "s1",
        name: "Bridal Makeup",
        description: "Complete bridal makeup including trial session",
        price: 250,
        duration: 120,
      },
      {
        id: "s2",
        name: "Special Event Makeup",
        description: "Full makeup for special occasions",
        price: 150,
        duration: 90,
      },
      {
        id: "s3",
        name: "Natural Everyday Look",
        description: "Light, natural makeup for daily wear",
        price: 100,
        duration: 60,
      },
      {
        id: "s4",
        name: "Makeup Lesson",
        description: "Personal makeup tutorial and techniques",
        price: 200,
        duration: 120,
      },
    ],
    reviews: [
      {
        id: "r1",
        user: "Emily Johnson",
        rating: 5,
        date: "2023-08-15",
        comment:
          "Sophia did my wedding makeup and I couldn't have been happier! She understood exactly what I wanted and made me feel beautiful all day.",
        userImage:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80",
      },
      {
        id: "r2",
        user: "Rebecca Liu",
        rating: 5,
        date: "2023-07-22",
        comment:
          "Amazing work for my photoshoot! Sophia is professional, punctual, and incredibly talented. Highly recommend!",
        userImage:
          "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80",
      },
      {
        id: "r3",
        user: "Maria Gonzalez",
        rating: 4,
        date: "2023-06-30",
        comment:
          "Great experience working with Sophia for my sister's wedding. She made everyone look gorgeous.",
        userImage:
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80",
      },
    ],
    availability: [
      {
        date: "2023-10-15",
        slots: ["09:00", "13:00", "16:00"],
      },
      {
        date: "2023-10-16",
        slots: ["10:00", "14:00"],
      },
      {
        date: "2023-10-17",
        slots: ["09:00", "11:00", "15:00", "17:00"],
      },
    ],
  },
  // More artists data...
];

// Get artist data by ID
async function getArtist(id: string) {
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
      instagram: true,
      facebook: true,
      twitter: true,
      tiktok: true,
      website: true,
      category: true,
      bio: true,
      yearsOfExperience: true,
      defaultPrice: true,
      // Count completed appointments
      _count: {
        select: {
          artistAppointments: {
            where: {
              status: "COMPLETED",
            },
          },
        },
      },
      // Get recent appointments for reviews
      artistAppointments: {
        where: {
          status: "COMPLETED",
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          serviceType: true,
          totalPrice: true,
          notes: true,
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
      metadata: {
        select: {
          id: true,
          availabilitySettings: true,
          artistSettings: true,
          preferences: true,
        },
      },
    },
  });

  return artist;
}

// Get artist services from metadata
async function getArtistServices(id: string) {
  const metadata = await db.userMetadata.findUnique({
    where: {
      userId: id,
    },
    select: {
      artistSettings: true,
    },
  });

  if (!metadata || !metadata.artistSettings) {
    // Default services if none are found
    return [
      {
        id: "1",
        name: "Bridal Makeup",
        description: "Complete bridal makeup with trials and day-of services",
        price: 250,
        duration: 120,
        isActive: true,
      },
      {
        id: "2",
        name: "Special Occasion Makeup",
        description: "Perfect for parties, events, or photoshoots",
        price: 150,
        duration: 90,
        isActive: true,
      },
    ];
  }

  try {
    const settings = JSON.parse(metadata.artistSettings);
    // Return only active services
    return settings.services?.filter((service: any) => service.isActive) || [];
  } catch (error) {
    console.error("Error parsing artist services:", error);
    return [];
  }
}

// Get availability settings for the artist
async function getArtistAvailabilitySettings(id: string) {
  const metadata = await db.userMetadata.findUnique({
    where: {
      userId: id,
    },
    select: {
      availabilitySettings: true,
    },
  });

  // Default settings if none are found
  const defaultAvailabilitySettings = {
    isAvailable: true,
    workingHours: {
      start: 10,
      end: 24,
      interval: 30,
    },
    regularDaysOff: [0, 6], // Sunday and Saturday
  };

  if (!metadata || !metadata.availabilitySettings) {
    return defaultAvailabilitySettings;
  }

  try {
    return JSON.parse(metadata.availabilitySettings);
  } catch (error) {
    console.error("Error parsing artist availability settings:", error);
    return defaultAvailabilitySettings;
  }
}

// Get artist reviews
async function getArtistReviews(id: string) {
  try {
    console.log("Fetching reviews for artist ID:", id);

    // First check if there are ANY reviews for this artist regardless of status
    const allReviews = await db.review.count({
      where: {
        artistId: id,
      },
    });

    console.log("Total reviews for artist (all statuses):", allReviews);

    // Then get the approved reviews
    const reviews = await db.review.findMany({
      where: {
        artistId: id,
        status: "APPROVED", // Only show approved reviews
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
        appointment: {
          select: {
            serviceType: true,
            datetime: true,
          },
        },
      },
    });

    console.log("Found approved reviews:", reviews.length);

    return reviews;
  } catch (error) {
    console.error("Error fetching artist reviews:", error);
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

  if (!artist) {
    notFound();
  }

  // Get artist reviews and calculate ratings
  const reviews = await getArtistReviews(params.id);
  console.log("Reviews from database:", reviews.length);

  // Make sure we only include approved reviews
  const approvedReviews = reviews.filter(
    (review: any) => review.status === "APPROVED"
  );

  // Calculate average rating from approved reviews
  const averageRating =
    approvedReviews.length > 0
      ? approvedReviews.reduce(
          (sum: number, review: any) => sum + review.rating,
          0
        ) / approvedReviews.length
      : null;
  const totalReviews = approvedReviews.length;

  // تحويل updatedAt من نوع Date إلى string لكل تعيين فني
  const formattedArtist = {
    ...artist,
    category: artist.category || undefined,
    averageRating,
    totalReviews,
    artistAppointments: artist.artistAppointments.map((appointment: any) => ({
      ...appointment,
      updatedAt: appointment.updatedAt.toISOString(), // تحويل التاريخ إلى سلسلة نصية
    })),
  };

  // Get real services from database
  const services = await getArtistServices(params.id);

  // Get artist availability settings
  const availabilitySettings = await getArtistAvailabilitySettings(params.id);

  // Format reviews for the ReviewList component
  const formattedReviews = approvedReviews.map((review: any) => ({
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
      serviceType: review.appointment.serviceType,
      datetime: review.appointment.datetime.toISOString(),
    },
  }));

  console.log("Formatted reviews:", formattedReviews.length);

  // Check if user is logged in
  const isUserLoggedIn = !!session?.user;

  return (
    <main>
      <ArtistClientPage
        artist={formattedArtist}
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
        {artist.yearsOfExperience && (
          <div className="flex items-center gap-1 mb-6 text-gray-600 bg-purple-50 border border-purple-100 rounded-lg p-3">
            <Award className="h-5 w-5 text-purple-500" />
            <span className="font-medium">
              {artist.yearsOfExperience} years of professional makeup experience
            </span>
          </div>
        )}
      </ArtistClientPage>
    </main>
  );
}
