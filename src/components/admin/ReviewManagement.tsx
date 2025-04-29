"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { ReviewCard, ReviewData } from "@/components/reviews/ReviewCard";
import { ReviewList } from "@/components/reviews/ReviewList";
import { toast } from "@/components/ui/use-toast";

interface ReviewManagementProps {
  initialReviews?: ReviewData[];
}

export function ReviewManagement({ initialReviews }: ReviewManagementProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewData | null>(null);
  const [action, setAction] = useState<"APPROVE" | "REJECT" | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const handleAction = async (
    reviewId: string,
    actionType: "APPROVE" | "REJECT"
  ) => {
    setIsPending(true);

    try {
      const response = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewId,
          action: actionType,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to process review");
      }

      toast({
        title: "Success",
        description: `Review has been ${
          actionType === "APPROVE" ? "approved" : "rejected"
        }.`,
        variant: "success",
      });

      // Refresh the page to update the reviews list
      router.refresh();
    } catch (error) {
      console.error(`Error ${actionType.toLowerCase()}ing review:`, error);
      toast({
        title: "Action Failed",
        description:
          error instanceof Error
            ? error.message
            : `Failed to ${actionType.toLowerCase()} review`,
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
      setIsConfirmDialogOpen(false);
      setSelectedReview(null);
      setAction(null);
    }
  };

  const confirmAction = (
    review: ReviewData,
    actionType: "APPROVE" | "REJECT"
  ) => {
    setSelectedReview(review);
    setAction(actionType);
    setIsConfirmDialogOpen(true);
  };

  const ReviewActions = ({ review }: { review: ReviewData }) => {
    return (
      <div className="flex gap-2 mt-4">
        {review.status === "PENDING" && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              onClick={() => confirmAction(review, "APPROVE")}
              disabled={isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
              onClick={() => confirmAction(review, "REJECT")}
              disabled={isPending}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </>
        )}

        {review.status === "APPROVED" && (
          <Button
            variant="outline"
            size="sm"
            className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
            onClick={() => confirmAction(review, "REJECT")}
            disabled={isPending}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Remove
          </Button>
        )}

        {review.status === "REJECTED" && (
          <Button
            variant="outline"
            size="sm"
            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            onClick={() => confirmAction(review, "APPROVE")}
            disabled={isPending}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Restore
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Review Management</h2>

      <div className="grid gap-6">
        <ReviewList
          initialReviews={initialReviews}
          showStatus
          variant="admin"
        />
      </div>

      <AlertDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action === "APPROVE" ? "Approve Review" : "Reject Review"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {action === "APPROVE"
                ? "This review will be publicly visible on the artist's profile. Are you sure you want to approve it?"
                : "This review will be hidden from public view. Are you sure you want to reject it?"}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {selectedReview && (
            <div className="my-4 border rounded-md p-4 bg-gray-50">
              <p className="font-medium">
                {selectedReview.user.name || "Anonymous"}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                {selectedReview.comment}
              </p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (selectedReview && action) {
                  handleAction(selectedReview.id, action);
                }
              }}
              disabled={isPending}
              className={
                action === "APPROVE"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {action === "APPROVE" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
