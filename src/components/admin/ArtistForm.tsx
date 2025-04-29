"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import { uploadImageToFirebase } from "@/lib/utils/upload";

// Artist form schema
const artistFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().optional(),
  password: z
    .string()
    .min(8, {
      message: "Password must be at least 8 characters.",
    })
    .optional(),
  image: z.string().optional(),
});

type ArtistFormValues = z.infer<typeof artistFormSchema>;

interface ArtistFormProps {
  artist?: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    phone: string | null;
  };
  mode?: "create" | "edit";
}

export default function ArtistForm({
  artist,
  mode = "create",
}: ArtistFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    artist?.image || null
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Form definition
  const form = useForm<ArtistFormValues>({
    resolver: zodResolver(artistFormSchema),
    defaultValues: {
      name: artist?.name || "",
      email: artist?.email || "",
      phone: artist?.phone || "",
      password: "",
      image: artist?.image || "",
    },
  });

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.includes("image")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image should be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle form submission
  const onSubmit = async (data: ArtistFormValues) => {
    setIsSubmitting(true);

    try {
      let imageUrl = data.image;

      // Upload image if selected
      if (imageFile) {
        setIsUploading(true);
        imageUrl = await uploadImageToFirebase(
          imageFile,
          `artists/${mode === "edit" ? artist?.id : "new"}`,
          (progress) => {
            setUploadProgress(progress);
          }
        );
        setIsUploading(false);
      }

      // Prepare data with updated image URL
      const artistData = {
        ...data,
        image: imageUrl,
        role: "ARTIST",
      };

      // API endpoint based on mode
      const endpoint =
        mode === "edit"
          ? `/api/admin/artists/${artist?.id}`
          : "/api/admin/artists";

      const method = mode === "edit" ? "PUT" : "POST";

      // Submit form
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(artistData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save artist");
      }

      // Success notification
      toast({
        title: mode === "edit" ? "Artist Updated" : "Artist Created",
        description:
          mode === "edit"
            ? "The artist has been updated successfully."
            : "The artist has been created successfully.",
        variant: "success",
      });

      // Redirect to artists list
      router.push("/admin/artists");
      router.refresh();
    } catch (error) {
      console.error("Error submitting artist form:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Profile Image */}
        <div className="space-y-4">
          <div className="flex items-center gap-8">
            <div>
              <Avatar className="h-24 w-24">
                <AvatarImage src={imagePreview || undefined} />
                <AvatarFallback className="text-lg">
                  {form.watch("name")?.[0]?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1">
              <Label
                htmlFor="image-upload"
                className="block text-sm font-medium mb-2"
              >
                Profile Image
              </Label>
              <div className="flex items-center gap-4">
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full max-w-sm"
                />
                {isUploading && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-500">
                      {uploadProgress}%
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Upload a profile image (max 5MB)
              </p>
            </div>
          </div>
        </div>

        {/* Artist Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormDescription>Enter the artist's full name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="artist@example.com"
                    type="email"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  The artist will use this email to log in.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="+1 (555) 123-4567" {...field} />
                </FormControl>
                <FormDescription>
                  Contact number for the artist.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {mode === "create" && (
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input placeholder="********" type="password" {...field} />
                  </FormControl>
                  <FormDescription>
                    Minimum 8 characters. The artist can change this later.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/artists")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || isUploading}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "edit" ? "Updating..." : "Creating..."}
              </>
            ) : mode === "edit" ? (
              "Update Artist"
            ) : (
              "Create Artist"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
