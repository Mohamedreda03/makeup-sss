"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, CheckCircle } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/reviews/StarRating";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { useSession } from "next-auth/react";

// Public review form schema
const publicReviewSchema = z.object({
  artistId: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  rating: z.number().min(1, "Please select a rating").max(5),
  comment: z.string().min(5, "Please provide feedback (minimum 5 characters)"),
  serviceType: z.string().min(2, "Please specify the service you received"),
});

type PublicReviewFormValues = z.infer<typeof publicReviewSchema>;

interface PublicReviewFormProps {
  artistId: string;
  artistName: string;
  onSuccess?: () => void;
}

export function PublicReviewForm({
  artistId,
  artistName,
  onSuccess,
}: PublicReviewFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<PublicReviewFormValues>({
    resolver: zodResolver(publicReviewSchema),
    defaultValues: {
      artistId,
      name: session?.user?.name || "Guest User",
      email: session?.user?.email || "guest@example.com",
      rating: 0,
      comment: "",
      serviceType: "General Service",
    },
  });

  const onSubmit = async (data: PublicReviewFormValues) => {
    try {
      setIsSubmitting(true);

      // If the user didn't change the default values, ensure they are valid
      if (data.name === "Guest User") {
        data.name = `Guest_${Date.now().toString().substring(8)}`;
      }

      if (data.email === "guest@example.com") {
        data.email = `guest_${Date.now().toString().substring(8)}@example.com`;
      }

      console.log("Submitting review data:", data);

      const response = await fetch("/api/reviews/public", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log("Response received:", result);

      if (!response.ok) {
        throw new Error(result.message || "Failed to submit review");
      }

      // Show success UI state
      setSubmitted(true);

      toast({
        title: "Review Submitted",
        description:
          "Your review has been submitted and is pending approval by an admin.",
        variant: "success",
      });

      form.reset();

      if (onSuccess) {
        onSuccess();
      }

      // Refresh the page after 2 seconds to show the updated reviews list
      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Submission Failed",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while submitting your review",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="w-full shadow-md bg-green-50">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-green-800">
              Review Submitted!
            </h3>
            <p className="text-green-700">
              Thank you for sharing your experience with {artistName}. Your
              review has been submitted and is pending approval.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSubmitted(false);
                form.reset({
                  artistId,
                  name: session?.user?.name || "Guest User",
                  email: session?.user?.email || "guest@example.com",
                  rating: 0,
                  comment: "",
                  serviceType: "General Service",
                });
              }}
            >
              Write Another Review
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
        <CardDescription>
          Share your experience with {artistName}
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Hidden fields - these will still be submitted but not shown to the user */}
            <input type="hidden" {...form.register("name")} />
            <input type="hidden" {...form.register("email")} />
            <input type="hidden" {...form.register("serviceType")} />

            {/* Rating field */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <StarRating
                        rating={field.value}
                        onChange={field.onChange}
                        interactive
                        size="lg"
                        color="amber"
                      />
                      <span className="text-sm text-gray-500">
                        {field.value > 0
                          ? `${field.value} star${field.value !== 1 ? "s" : ""}`
                          : "Select a rating"}
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Comment field */}
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Review</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about your experience. What did you like? What could be improved?"
                      className="min-h-[120px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
