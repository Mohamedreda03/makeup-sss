"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewCard, ReviewData } from "@/components/reviews/ReviewCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { StarRating } from "@/components/reviews/StarRating";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ReviewListProps {
  artistId?: string;
  initialReviews?: ReviewData[];
  showStatus?: boolean;
  variant?: "default" | "artist" | "admin";
}

export function ReviewList({
  artistId,
  initialReviews,
  showStatus = false,
  variant = "default",
}: ReviewListProps) {
  console.log(
    "ReviewList mounted with initialReviews:",
    initialReviews?.length
  );
  console.log("ReviewList variant:", variant);

  if (initialReviews) {
    console.log(
      "Initial reviews statuses:",
      initialReviews.map((r) => r.status).join(", ")
    );
  }

  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewData[]>(initialReviews || []);
  const [isLoading, setIsLoading] = useState(!initialReviews);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [isProcessing, setIsProcessing] = useState(false);

  // For confirmation dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "APPROVE" | "REJECT" | null
  >(null);

  useEffect(() => {
    if (initialReviews) {
      // If variant is not admin, only show approved reviews
      const filteredReviews =
        variant !== "admin"
          ? initialReviews.filter((review) => review.status === "APPROVED")
          : initialReviews;
      console.log(
        "Setting reviews from initialReviews:",
        filteredReviews.length
      );
      setReviews(filteredReviews);
      return;
    }

    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const url = artistId
          ? `/api/reviews?artistId=${artistId}`
          : "/api/reviews";

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Failed to fetch reviews");
        }

        const data = await response.json();

        // If variant is not admin, only show approved reviews
        const filteredReviews =
          variant !== "admin"
            ? data.filter((review: ReviewData) => review.status === "APPROVED")
            : data;

        setReviews(filteredReviews);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setError("Failed to load reviews. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [artistId, initialReviews, variant]);

  // Filter reviews based on active tab (relevant for admin view)
  const filteredReviews = reviews.filter((review) => {
    if (activeTab === "all") return true;
    return review.status.toLowerCase() === activeTab.toLowerCase();
  });
  console.log("Filtered reviews for display:", filteredReviews.length);

  // Calculate average rating
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
      : 0;

  // Handle review action (approve/reject)
  const handleReviewAction = async (
    reviewId: string,
    action: "APPROVE" | "REJECT"
  ) => {
    // For admin interface, show a confirmation dialog
    if (variant === "admin") {
      setSelectedReviewId(reviewId);
      setPendingAction(action);
      setIsDialogOpen(true);
      return;
    }
  };

  // Execute approve/reject action after confirmation
  const executeAction = async () => {
    if (!selectedReviewId || !pendingAction) return;

    setIsProcessing(true);
    try {
      const response = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewId: selectedReviewId,
          action: pendingAction,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to process review");
      }

      // Update local state
      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review.id === selectedReviewId
            ? {
                ...review,
                status: pendingAction === "APPROVE" ? "APPROVED" : "REJECTED",
              }
            : review
        )
      );

      toast({
        title: "Success",
        description: `Review has been ${
          pendingAction === "APPROVE" ? "approved" : "rejected"
        }.`,
        variant: "success",
      });

      // Close dialog
      setIsDialogOpen(false);
      setSelectedReviewId(null);
      setPendingAction(null);

      // Refresh the page to update everything
      router.refresh();
    } catch (error) {
      console.error(`Error processing review:`, error);
      toast({
        title: "Action Failed",
        description:
          error instanceof Error ? error.message : `Failed to process review`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
        <p className="text-gray-500">No reviews available yet.</p>
      </div>
    );
  }

  const getSelectedReview = () => {
    if (!selectedReviewId) return null;
    return reviews.find((review) => review.id === selectedReviewId);
  };

  const selectedReview = getSelectedReview();

  // Enhanced display for artist variant
  if (variant === "artist" && filteredReviews.length > 0) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-purple-900">
              Client Reviews
            </h3>
            <div className="flex items-center gap-2">
              <div className="text-lg font-bold text-rose-500">
                {averageRating.toFixed(1)}
              </div>
              <StarRating rating={averageRating} size="md" color="amber" />
              <span className="text-sm text-gray-500 ml-2">
                ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredReviews.map((review) => (
              <div key={review.id} className="animate-fadeIn">
                <ReviewCard
                  review={review}
                  showStatus={showStatus}
                  variant={variant}
                />
              </div>
            ))}
          </div>

          {filteredReviews.length >= 5 && (
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                View More Reviews
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Original display for admin or default variant
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-semibold">Client Reviews</h3>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-500">
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </p>
            {variant === "artist" && (
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-1">•</span>
                <StarRating rating={averageRating} size="sm" color="amber" />
                <span className="text-sm font-medium ml-1 text-amber-600">
                  {averageRating.toFixed(1)}
                </span>
              </div>
            )}
            {variant !== "artist" && (
              <span className="text-sm text-gray-500">
                • Average rating: {averageRating.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        {variant === "admin" && (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-auto"
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      <div className="space-y-4">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              showStatus={showStatus}
              variant={variant}
              onApprove={
                variant === "admin"
                  ? (id) => handleReviewAction(id, "APPROVE")
                  : undefined
              }
              onReject={
                variant === "admin"
                  ? (id) => handleReviewAction(id, "REJECT")
                  : undefined
              }
              isProcessing={isProcessing && selectedReviewId === review.id}
            />
          ))
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <p className="text-gray-500">No reviews available yet.</p>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction === "APPROVE" ? "Approve Review" : "Reject Review"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction === "APPROVE"
                ? "This review will be publicly visible on the artist's profile. Are you sure you want to approve it?"
                : "This review will be hidden from public view. Are you sure you want to reject it?"}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {selectedReview && (
            <div className="my-4 border rounded-md p-4 bg-gray-50">
              <div className="flex gap-2 items-center">
                <StarRating
                  rating={selectedReview.rating}
                  size="sm"
                  color="amber"
                />
                <span className="text-sm text-gray-500">
                  by {selectedReview.user.name || "Anonymous User"}
                </span>
              </div>
              <p className="text-sm text-gray-700 mt-2">
                "{selectedReview.comment}"
              </p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                executeAction();
              }}
              disabled={isProcessing}
              className={
                pendingAction === "APPROVE"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : pendingAction === "APPROVE" ? (
                "Approve"
              ) : (
                "Reject"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
