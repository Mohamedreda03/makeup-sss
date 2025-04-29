"use client";

import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/reviews/StarRating";
import {
  Calendar,
  Clock,
  Tag,
  CheckCircle,
  XCircle,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ReviewData {
  id: string;
  rating: number;
  comment: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  appointment: {
    serviceType: string;
    datetime: string;
  };
}

interface ReviewCardProps {
  review: ReviewData;
  showStatus?: boolean;
  variant?: "default" | "artist" | "admin";
  onApprove?: (reviewId: string) => void;
  onReject?: (reviewId: string) => void;
  isProcessing?: boolean;
}

export function ReviewCard({
  review,
  showStatus = false,
  variant = "default",
  onApprove,
  onReject,
  isProcessing = false,
}: ReviewCardProps) {
  const statusColors = {
    PENDING: "bg-amber-100 text-amber-700 hover:bg-amber-200 border-0",
    APPROVED: "bg-green-100 text-green-700 hover:bg-green-200 border-0",
    REJECTED: "bg-red-100 text-red-700 hover:bg-red-200 border-0",
  };

  const variantStyles = {
    default: "border-0 shadow-sm hover:shadow-md bg-white",
    artist:
      "border-0 shadow rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg bg-white border-purple-100",
    admin: "border border-gray-200 bg-white",
  };

  const isAdmin = variant === "admin";
  const isArtistView = variant === "artist";
  const shouldShowActions = isAdmin && onApprove && onReject;

  // Simplified card for artist view
  if (isArtistView) {
    return (
      <Card className={variantStyles.artist}>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Avatar className="h-14 w-14 border-2 border-purple-100 shadow-sm">
              <AvatarImage
                src={review.user.image || undefined}
                alt={review.user.name || "User"}
              />
              <AvatarFallback className="bg-rose-100 text-rose-600 text-xl">
                {review.user.name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-semibold text-purple-900 text-lg">
                    {review.user.name || "Anonymous User"}
                  </h3>
                  <div className="flex items-center mt-1">
                    <StarRating
                      rating={review.rating}
                      size="sm"
                      color="amber"
                    />
                    <span className="ml-2 text-gray-500 text-sm">
                      {format(new Date(review.createdAt), "MMMM d, yyyy")}
                    </span>
                  </div>
                </div>

                {showStatus && (
                  <Badge className={statusColors[review.status]}>
                    {review.status.charAt(0) +
                      review.status.slice(1).toLowerCase()}
                  </Badge>
                )}
              </div>

              <div className="relative mt-4 bg-purple-50 p-4 rounded-lg">
                <Quote className="absolute text-purple-200 h-8 w-8 -top-2 -left-2 -z-0" />
                <p className="text-gray-700 relative z-10 text-md">
                  {review.comment}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Original card with all details for admin or default view
  return (
    <Card
      className={`overflow-hidden transition-shadow ${variantStyles[variant]}`}
    >
      <CardHeader className="p-4 flex flex-row items-start gap-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-pink-100">
        <Avatar className="border-2 border-white shadow-sm">
          <AvatarImage
            src={review.user.image || undefined}
            alt={review.user.name || "User"}
          />
          <AvatarFallback className="bg-rose-100 text-rose-600">
            {review.user.name?.[0] || "U"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-purple-800">
                {review.user.name || "Anonymous User"}
              </h3>
              <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                <span className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(new Date(review.createdAt), "MMM d, yyyy")}
                </span>
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {format(new Date(review.createdAt), "h:mm a")}
                </span>
              </div>
            </div>
            <StarRating rating={review.rating} size="sm" color="amber" />
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <Badge
              variant="secondary"
              className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-0"
            >
              <Tag className="h-3 w-3 mr-1" />
              {review.appointment.serviceType}
            </Badge>

            {showStatus && (
              <Badge className={statusColors[review.status]}>
                {review.status.charAt(0) + review.status.slice(1).toLowerCase()}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 bg-white">
        <p className="text-gray-700 whitespace-pre-line">{review.comment}</p>
      </CardContent>

      {shouldShowActions && (
        <CardFooter className="p-3 bg-gray-50 border-t flex justify-end gap-2">
          {review.status === "PENDING" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                onClick={() => onApprove(review.id)}
                disabled={isProcessing}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                onClick={() => onReject(review.id)}
                disabled={isProcessing}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </>
          )}

          {review.status === "APPROVED" && (
            <Button
              size="sm"
              variant="outline"
              className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
              onClick={() => onReject(review.id)}
              disabled={isProcessing}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Remove
            </Button>
          )}

          {review.status === "REJECTED" && (
            <Button
              size="sm"
              variant="outline"
              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              onClick={() => onApprove(review.id)}
              disabled={isProcessing}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Restore
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
