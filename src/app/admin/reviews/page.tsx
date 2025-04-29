import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ReviewManagement } from "@/components/admin/ReviewManagement";
import { ExtendedUser } from "@/types/next-auth";
import { Review } from "@/generated/prisma";

export const metadata: Metadata = {
  title: "Review Management | Admin Dashboard",
  description: "Manage and moderate user reviews",
};

// Define interface for Review with included relations
interface ReviewWithRelations extends Review {
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  artist: {
    id: string;
    name: string | null;
    image: string | null;
  };
  appointment: {
    serviceType: string;
    datetime: Date;
  };
}

async function getReviews() {
  try {
    const reviews = await db.review.findMany({
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
        artist: {
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

    // Convert Date objects to ISO strings for compatibility with ReviewData interface
    return reviews.map((review: ReviewWithRelations) => ({
      ...review,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
      appointment: {
        ...review.appointment,
        datetime: review.appointment.datetime.toISOString(),
      },
    }));
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
}

export default async function AdminReviewsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = session.user as ExtendedUser;

  if (user.role !== "ADMIN") {
    notFound();
  }

  const reviews = await getReviews();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Review Management</h1>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <ReviewManagement initialReviews={reviews} />
      </div>
    </div>
  );
}
