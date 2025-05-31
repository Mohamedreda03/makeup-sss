"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Loader2, Plus, Trash2, Edit2 } from "lucide-react";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// Service interface
interface Service {
  id?: string;
  name: string;
  description?: string | null;
  price: number;
  duration?: number;
  isActive: boolean;
  artistId: string;
}

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().optional(),
  address: z.string().optional(),
  image: z.string().optional(),
  bio: z.string().optional(),
  pricing: z.coerce.number().min(0).optional(),
  experience_years: z.string().optional(),
  portfolio: z.string().optional(),
  gender: z.string().optional(),
  availability: z.boolean().default(false),
  // Social media fields
  instagram_url: z
    .string()
    .url("Please enter a valid Instagram URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  facebook_url: z
    .string()
    .url("Please enter a valid Facebook URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  twitter_url: z
    .string()
    .url("Please enter a valid Twitter URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  tiktok_url: z
    .string()
    .url("Please enter a valid TikTok URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  youtube_url: z
    .string()
    .url("Please enter a valid YouTube URL")
    .optional()
    .nullable()
    .or(z.literal("")),
});

// Service validation schema
const serviceSchema = z.object({
  name: z.string().min(2, "Service name is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  duration: z.coerce
    .number()
    .min(15, "Duration must be at least 15 minutes")
    .optional(),
  isActive: z.boolean().default(true),
});

// Artist type definition
interface Artist {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  phone: string | null;
  address: string | null;
  role: string;
  createdAt: string;
  makeup_artist?: {
    pricing: number;
    experience_years: string;
    portfolio: string | null;
    gender: string;
    rating: number;
    address: string;
    bio: string | null;
    availability: boolean;
  } | null;
  services?: Service[];
}

// Service interface - removed as not needed anymore

export default function EditArtistPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Services state
  const [services, setServices] = useState<Service[]>([]);
  const [isServiceDialogOpen, setIsServiceDialogOpen] =
    useState<boolean>(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    price: 0,
    duration: 60,
    isActive: true,
  });
  // State for delete confirmation
  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      image: "",
      bio: "",
      pricing: 0,
      experience_years: "",
      portfolio: "",
      gender: "",
      availability: false,
      instagram_url: "",
      facebook_url: "",
      twitter_url: "",
      tiktok_url: "",
      youtube_url: "",
    },
  });
  const { reset, setValue } = form;

  // Fetch services for the artist with stable reference
  const fetchServices = useCallback(async () => {
    try {
      const response = await fetch(`/api/services?userId=${params.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }
      const servicesData = await response.json();
      setServices(servicesData);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load services. Please try again.",
        variant: "destructive",
      });
    }
  }, [params.id]);

  // Create or update service
  const handleSaveService = async () => {
    try {
      const validation = serviceSchema.safeParse(serviceForm);
      if (!validation.success) {
        toast({
          title: "Validation Error",
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        return;
      }

      const serviceData = {
        ...validation.data,
        artistId: params.id,
      };

      let response;
      if (editingService?.id) {
        response = await fetch("/api/services", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...serviceData, id: editingService.id }),
        });
      } else {
        response = await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(serviceData),
        });
      }

      if (!response.ok) {
        throw new Error("Failed to save service");
      }

      toast({
        title: "Success",
        description: editingService?.id
          ? "Service updated successfully"
          : "Service created successfully",
      });

      setIsServiceDialogOpen(false);
      setEditingService(null);
      setServiceForm({
        name: "",
        description: "",
        price: 0,
        duration: 60,
        isActive: true,
      });
      fetchServices();
    } catch {
      toast({
        title: "Error",
        description: "Failed to save service. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Delete service by id
  const handleDeleteService = async (serviceId: string) => {
    try {
      const response = await fetch(
        `/api/services?id=${serviceId}&artistId=${params.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete service");
      }

      toast({
        title: "Success",
        description: "Service deleted successfully",
      });

      fetchServices();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete service. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Confirm deletion after dialog
  const handleConfirmDelete = () => {
    if (deleteServiceId) {
      handleDeleteService(deleteServiceId);
    }
    setIsDeleteDialogOpen(false);
    setDeleteServiceId(null);
  };

  // Open service dialog for editing
  const openServiceDialog = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setServiceForm({
        name: service.name,
        description: service.description || "",
        price: service.price,
        duration: service.duration || 60,
        isActive: service.isActive,
      });
    } else {
      setEditingService(null);
      setServiceForm({
        name: "",
        description: "",
        price: 0,
        duration: 60,
        isActive: true,
      });
    }
    setIsServiceDialogOpen(true);
  };

  // Fetch artist and services only when ID or session changes
  useEffect(() => {
    const fetchArtist = async () => {
      try {
        const response = await fetch(`/api/admin/artists/${params.id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch artist data");
        }

        const data = await response.json();
        setArtist(data);

        const formValues = {
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          image: data.image || "",
          bio: data.makeup_artist?.bio || "",
          pricing: data.makeup_artist?.pricing || 0,
          experience_years: data.makeup_artist?.experience_years || "",
          portfolio: data.makeup_artist?.portfolio || "",
          gender: data.makeup_artist?.gender || "",
          availability: data.makeup_artist?.availability || false,
          instagram_url: data.makeup_artist?.instagram_url || "",
          facebook_url: data.makeup_artist?.facebook_url || "",
          twitter_url: data.makeup_artist?.twitter_url || "",
          tiktok_url: data.makeup_artist?.tiktok_url || "",
          youtube_url: data.makeup_artist?.youtube_url || "",
        };
        reset(formValues);

        await fetchServices();
      } catch {
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
  }, [params.id, session?.user, fetchServices, reset]);

  // Handle image update
  const handleImageUploaded = (imageUrl: string) => {
    setValue("image", imageUrl);
    updateArtistImage(imageUrl);
  };

  // Update artist image directly
  const updateArtistImage = async (imageUrl: string) => {
    if (!artist?.id || !imageUrl) return;

    try {
      setIsSaving(true);

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

      setArtist({
        ...artist,
        image: imageUrl,
      });

      toast({
        title: "Success",
        description: "Artist image updated successfully.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update artist image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSaving(true);

    try {
      const formattedValues = {
        ...values,
        pricing:
          values.pricing !== undefined ? Number(values.pricing) : undefined,
      };

      const updateData = {
        ...formattedValues,
        image: formattedValues.image || artist?.image || null,
      };

      if (!updateData.name || !updateData.email) {
        toast({
          title: "Error",
          description: "Name and email are required fields.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      const response = await fetch(`/api/admin/artists/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update artist");
      }

      const updatedArtist = await response.json();

      setArtist(updatedArtist);

      const formValues = {
        name: updatedArtist.name || "",
        email: updatedArtist.email || "",
        phone: updatedArtist.phone || "",
        address: updatedArtist.address || "",
        image: updatedArtist.image || "",
        bio: updatedArtist.makeup_artist?.bio || "",
        pricing: updatedArtist.makeup_artist?.pricing || 0,
        experience_years: updatedArtist.makeup_artist?.experience_years || "",
        portfolio: updatedArtist.makeup_artist?.portfolio || "",
        gender: updatedArtist.makeup_artist?.gender || "",
        availability: updatedArtist.makeup_artist?.availability || false,
        instagram_url: updatedArtist.makeup_artist?.instagram_url || "",
        facebook_url: updatedArtist.makeup_artist?.facebook_url || "",
        twitter_url: updatedArtist.makeup_artist?.twitter_url || "",
        tiktok_url: updatedArtist.makeup_artist?.tiktok_url || "",
        youtube_url: updatedArtist.makeup_artist?.youtube_url || "",
      };
      reset(formValues);

      toast({
        title: "Success",
        description: "Artist information updated successfully.",
      });

      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description:
          typeof error === "object" && error !== null && "message" in error
            ? (error as Error).message
            : "Failed to update artist. Please try again.",
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
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Address" {...field} />
                        </FormControl>
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Makeup Artist Information</CardTitle>
                  <CardDescription>
                    Professional details for the makeup artist.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="pricing"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pricing (EGP)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Service pricing"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          The pricing for the artist's services in Egyptian
                          Pound
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="experience_years"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years of Experience</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 5 years" {...field} />
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
                    name="portfolio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Portfolio URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Portfolio website or social media link"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Link to the artist's portfolio or work samples
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Female, Male" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="availability"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Available for Bookings</FormLabel>
                          <FormDescription>
                            Toggle on when the artist is available to take
                            bookings
                          </FormDescription>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Social Media</CardTitle>
                  <CardDescription>
                    Add social media links for the makeup artist's online
                    presence.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="instagram_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://instagram.com/username"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Link to the artist's Instagram profile
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="facebook_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facebook URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://facebook.com/page"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Link to the artist's Facebook page
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="twitter_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://twitter.com/username"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Link to the artist's Twitter profile
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tiktok_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TikTok URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://tiktok.com/@username"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Link to the artist's TikTok profile
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="youtube_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>YouTube URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://youtube.com/channel/..."
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Link to the artist's YouTube channel
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Services</CardTitle>
                      <CardDescription>
                        Manage services offered by this artist
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      onClick={() => openServiceDialog()}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Service
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {services.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No services added yet.</p>
                      <p className="text-sm">
                        Click "Add Service" to get started.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Price (EGP)</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {services.map((service) => (
                          <TableRow key={service.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {service.name}
                                </div>
                                {service.description && (
                                  <div className="text-sm text-gray-500">
                                    {service.description}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{service.price} EGP</TableCell>
                            <TableCell>{service.duration || 60} min</TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  service.isActive
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {service.isActive ? "Active" : "Inactive"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openServiceDialog(service)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setDeleteServiceId(service.id!);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
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

      {/* Service Dialog */}
      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Edit Service" : "Add New Service"}
            </DialogTitle>
            <DialogDescription>
              {editingService
                ? "Update the service details below."
                : "Add a new service for this artist."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="serviceName">Service Name</Label>
              <Input
                id="serviceName"
                value={serviceForm.name}
                onChange={(e) =>
                  setServiceForm({ ...serviceForm, name: e.target.value })
                }
                placeholder="e.g., Bridal Makeup"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="serviceDescription">Description</Label>
              <Textarea
                id="serviceDescription"
                value={serviceForm.description}
                onChange={(e) =>
                  setServiceForm({
                    ...serviceForm,
                    description: e.target.value,
                  })
                }
                placeholder="Describe the service..."
                className="min-h-[80px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="servicePrice">Price (EGP)</Label>
                <Input
                  id="servicePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={serviceForm.price}
                  onChange={(e) =>
                    setServiceForm({
                      ...serviceForm,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="serviceDuration">Duration (min)</Label>
                <Input
                  id="serviceDuration"
                  type="number"
                  min="15"
                  step="15"
                  value={serviceForm.duration}
                  onChange={(e) =>
                    setServiceForm({
                      ...serviceForm,
                      duration: parseInt(e.target.value) || 60,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="serviceActive"
                checked={serviceForm.isActive}
                onChange={(e) =>
                  setServiceForm({
                    ...serviceForm,
                    isActive: e.target.checked,
                  })
                }
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label htmlFor="serviceActive">Service is active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsServiceDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveService}>
              {editingService ? "Update Service" : "Add Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this service? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
