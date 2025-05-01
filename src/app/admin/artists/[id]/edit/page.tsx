"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { CategorySelector } from "@/components/admin/CategorySelector";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import ServiceManager from "@/components/services/ServiceManager";

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  twitter: z.string().optional(),
  tiktok: z.string().optional(),
  website: z.string().optional(),
  bio: z.string().optional(),
  yearsOfExperience: z.coerce.number().min(0).optional(),
  category: z.string().optional(),
  defaultPrice: z.coerce.number().min(0).optional(),
  image: z.string().optional(),
});

// Artist type definition
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
  category?: string | null;
  defaultPrice?: number | null;
  metadata?: {
    artistSettings?: string | null;
  };
}

// Service interface
interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration?: number;
  isActive?: boolean;
}

export default function EditArtistPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [artistSettings, setArtistSettings] = useState<any>({
    category: "",
    specialties: [],
    certificates: [],
    services: [],
  });

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      instagram: "",
      facebook: "",
      twitter: "",
      tiktok: "",
      website: "",
      bio: "",
      yearsOfExperience: 0,
      category: "",
      defaultPrice: 0,
      image: "",
    },
  });

  // Fetch artist data
  useEffect(() => {
    const fetchArtist = async () => {
      try {
        const response = await fetch(`/api/admin/artists/${params.id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch artist data");
        }

        const data = await response.json();
        console.log("Artist data received:", data);
        setArtist(data);

        // Parse artist settings if available
        if (data.metadata?.artistSettings) {
          try {
            const settings = JSON.parse(data.metadata.artistSettings);
            setArtistSettings(settings);
          } catch (error) {
            console.error("Error parsing artist settings:", error);
          }
        }

        // Set form values
        const formValues = {
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          instagram: data.instagram || "",
          facebook: data.facebook || "",
          twitter: data.twitter || "",
          tiktok: data.tiktok || "",
          website: data.website || "",
          bio: data.bio || "",
          yearsOfExperience: data.yearsOfExperience || 0,
          category: data.category || "",
          defaultPrice: data.defaultPrice || 0,
          image: data.image || "",
        };
        console.log("Setting form values:", formValues);
        form.reset(formValues);
      } catch (error) {
        console.error("Error fetching artist:", error);
        toast({
          title: "Error",
          description: "Could not load artist data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchArtist();
    }
  }, [params.id, session, form]);

  // Handle image update
  const handleImageUploaded = (imageUrl: string) => {
    console.log("Image uploaded successfully, setting value:", imageUrl);
    form.setValue("image", imageUrl);

    // Auto-save image update to make sure it's applied immediately
    updateArtistImage(imageUrl);
  };

  // Update artist image directly
  const updateArtistImage = async (imageUrl: string) => {
    if (!artist?.id || !imageUrl) return;

    try {
      setIsSaving(true);
      console.log("Updating artist image directly:", imageUrl);

      // Send only the image update to prevent overwriting other fields
      const response = await fetch(`/api/admin/artists/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: imageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update artist image");
      }

      // Refresh the artist data
      const updatedArtist = await response.json();
      console.log("Artist image updated successfully:", updatedArtist.image);

      // Update local state
      setArtist({
        ...artist,
        image: imageUrl,
      });

      toast({
        title: "Success",
        description: "Artist image updated successfully.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error updating artist image:", error);
      toast({
        title: "Error",
        description: "Failed to update artist image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle service changes
  const handleServicesChange = (services: Service[]) => {
    setArtistSettings({
      ...artistSettings,
      services,
    });
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSaving(true);

    try {
      // Log values being sent to API
      console.log("Updating artist with data:", values);

      // Make sure image is included in the update
      const updateData = {
        ...values,
        image: values.image || artist?.image || null, // Use existing image if no new one selected
      };

      // Update basic artist information
      const response = await fetch(`/api/admin/artists/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error response:", errorData);
        throw new Error(errorData.message || "Failed to update artist");
      }

      const updatedArtist = await response.json();
      console.log("Artist updated successfully:", updatedArtist);

      // Update artist settings with category and services
      const settingsResponse = await fetch(
        `/api/artist/settings?artistId=${params.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...updateData,
            specialties: artistSettings.specialties || [],
            certificates: artistSettings.certificates || [],
            services: artistSettings.services || [],
          }),
        }
      );

      if (!settingsResponse.ok) {
        throw new Error("Failed to update artist settings");
      }

      toast({
        title: "Success",
        description: "Artist information updated successfully.",
        variant: "success",
      });

      router.push("/admin/artists");
    } catch (error) {
      console.error("Error updating artist:", error);
      toast({
        title: "Error",
        description: "Failed to update artist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  // Show error if artist not found
  if (!artist) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Artist Not Found</CardTitle>
            <CardDescription>
              The artist you are looking for could not be found.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/admin/artists")}>
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Artist</h1>
        <Button variant="outline" onClick={() => router.push("/admin/artists")}>
          Back to Artists
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Artist Profile</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {/* Profile Image Upload */}
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <div className="space-y-2">
                    <AdminImageUpload
                      currentImage={field.value || artist.image || undefined}
                      name={artist.name || "Artist"}
                      onImageUploaded={handleImageUploaded}
                      folder="artist-profiles"
                    />
                  </div>
                )}
              />
              <h2 className="text-xl font-semibold mt-4">{artist.name}</h2>
              <p className="text-gray-500">{artist.email}</p>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Update the artist's personal information.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Artist name" {...field} />
                        </FormControl>
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
                          <Input placeholder="Email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="yearsOfExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years of Experience</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter years of experience"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          How many years of experience does the artist have?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Artist's professional bio"
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Describe the artist's background, experience, and
                          specialties.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="defaultPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Price (EGP)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Default service price"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          The default price for the artist's services in
                          Egyptian Pound
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <ServiceManager userId={artist.id} />

              <Card>
                <CardHeader>
                  <CardTitle>Social Media</CardTitle>
                  <CardDescription>
                    Add social media links to promote the artist's profile.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Instagram username or full URL"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter username (e.g., "makeupbyname") or full URL.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="facebook"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facebook</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Facebook username or full URL"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="twitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Twitter username or full URL"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tiktok"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TikTok</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="TikTok username or full URL"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="Website URL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/artists")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
