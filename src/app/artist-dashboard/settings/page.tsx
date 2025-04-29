"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  useArtistSettings,
  ArtistSettingsFormValues,
} from "@/hooks/use-artist-settings";
import { artistSettingsSchema } from "@/lib/validations/artist-settings";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { uploadImageToCloudinary } from "@/lib/utils/cloudinary-upload";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";

// Custom image component with cache busting
const CacheBustedImage = ({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) => {
  // Force refresh by adding a timestamp
  const cacheBustedSrc = React.useMemo(() => {
    if (!src) return "";
    // Add timestamp to URL to prevent browser caching
    return src.includes("?")
      ? `${src}&_=${Date.now()}`
      : `${src}?_=${Date.now()}`;
  }, [src]);

  return (
    <img
      src={cacheBustedSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        console.error("Image failed to load:", src);
        // Fall back to a default image
        e.currentTarget.src = "/img/default-avatar.png";
      }}
    />
  );
};

export default function ArtistSettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [avatarKey, setAvatarKey] = useState(0);

  const {
    settings,
    isLoading,
    error,
    updateSettings,
    updateProfileImage,
    updatePassword,
    currentUser,
    updateSession,
  } = useArtistSettings();

  const { currentUser: freshUserData, refreshUserData } = useCurrentUser();
  const queryClient = useQueryClient();

  // Redirect if not an artist
  useEffect(() => {
    // Only redirect if:
    // 1. Not loading anymore
    // 2. User session is loaded (currentUser exists)
    // 3. There are no settings
    // 4. User is not an artist (based on role)
    if (
      !isLoading &&
      currentUser &&
      !settings &&
      currentUser.role !== "ARTIST"
    ) {
      router.push("/profile");
    }
  }, [isLoading, settings, currentUser, router]);

  // Refresh user data on page load
  useEffect(() => {
    refreshUserData();
    // Force avatar refresh
    setAvatarKey(Date.now());
  }, [refreshUserData]);

  const form = useForm<ArtistSettingsFormValues>({
    resolver: zodResolver(artistSettingsSchema),
    defaultValues: {
      name: "",
      email: "",
      yearsOfExperience: undefined,
      bio: "",
      instagram: "",
      facebook: "",
      twitter: "",
      tiktok: "",
      website: "",
      defaultPrice: undefined,
      category: "",
      certificates: [],
      services: [],
      specialties: [],
    },
    mode: "onChange",
  });

  // Update form values when settings data is loaded
  useEffect(() => {
    if (settings) {
      form.reset({
        name: settings.name || "",
        email: settings.email || "",
        yearsOfExperience: settings.yearsOfExperience || undefined,
        bio: settings.bio || "",
        instagram: settings.instagram || "",
        facebook: settings.facebook || "",
        twitter: settings.twitter || "",
        tiktok: settings.tiktok || "",
        website: settings.website || "",
        defaultPrice: settings.defaultPrice || undefined,
        category: settings.category || "",
        certificates: settings.certificates || [],
        services: settings.services || [],
        specialties: settings.specialties || [],
      });
    }
  }, [settings, form]);

  // Handle form submission
  const onSubmit = async (data: ArtistSettingsFormValues) => {
    updateSettings.mutate(data);
  };

  // Handle profile image change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or WebP image",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);

    // Create a preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle profile image upload
  const handleUploadImage = async () => {
    if (!imageFile) return;
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload image to Cloudinary with progress tracking
      const imageUrl = await uploadImageToCloudinary(
        imageFile,
        "artist-profiles",
        (progress) => {
          setUploadProgress(progress);
        }
      );

      if (imageUrl) {
        console.log("Image uploaded successfully to Cloudinary:", imageUrl);

        // Update profile image using our mutation
        const updatedImageUrl = await updateProfileImage.mutateAsync(imageUrl);
        console.log("Profile image updated in database:", updatedImageUrl);

        // Reset upload state
        setImageFile(null);

        // Update preview with the cache-busting URL
        setPreviewUrl(updatedImageUrl);

        // Refresh user data from database
        await refreshUserData();

        // Force rerender by setting a new key on the avatar component
        setAvatarKey(Date.now());
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload Error",
        description:
          "An error occurred while uploading your image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle password update
  const handlePasswordUpdate = async () => {
    setPasswordError("");

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setIsSubmittingPassword(true);

    try {
      await updatePassword.mutateAsync({ newPassword });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      // Error is handled by the mutation
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If the user is not an artist or there's an authentication issue, show a message
  if (!settings && currentUser) {
    return (
      <div className="container py-10">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">
            هذه الصفحة خاصة بالفنانين فقط
          </h2>
          <p className="mb-6 text-muted-foreground">
            يجب أن تكون لديك حساب فنان للوصول إلى هذه الصفحة.
          </p>
          <Button onClick={() => router.push("/profile")}>
            العودة إلى الصفحة الشخصية
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Artist Settings</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="social">Social & Services</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Manage your public profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Image */}
              <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                <div className="flex flex-col items-center space-y-2">
                  <Avatar
                    className="h-24 w-24 border-2 border-primary/20"
                    key={`avatar-${avatarKey}`}
                  >
                    {previewUrl ||
                    freshUserData?.image ||
                    currentUser?.image ? (
                      <div className="w-full h-full overflow-hidden rounded-full">
                        <CacheBustedImage
                          src={
                            previewUrl ||
                            freshUserData?.image ||
                            currentUser?.image ||
                            ""
                          }
                          alt={
                            freshUserData?.name ||
                            currentUser?.name ||
                            "Profile"
                          }
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {freshUserData?.name?.charAt(0) ||
                          currentUser?.name?.charAt(0) ||
                          "A"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex space-x-2 mt-2">
                    <label
                      htmlFor="profile-image"
                      className={cn(
                        "flex cursor-pointer items-center gap-1 text-sm text-primary px-2 py-1 rounded-md border border-primary/20 hover:bg-primary/10 transition-colors",
                        isUploading && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Change Photo</span>
                      <input
                        type="file"
                        id="profile-image"
                        className="hidden"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageChange}
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                </div>
                <div className="flex-1">
                  {previewUrl && (
                    <div className="flex flex-col space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Preview your new profile photo
                      </p>

                      {isUploading && (
                        <div className="space-y-2 mb-2">
                          <Progress
                            value={uploadProgress}
                            className="h-2 w-full"
                          />
                          <p className="text-xs text-muted-foreground text-center">
                            {uploadProgress < 100
                              ? `Uploading: ${uploadProgress.toFixed(0)}%`
                              : "Processing image..."}
                          </p>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={handleUploadImage}
                          disabled={isUploading}
                          className="bg-primary hover:bg-primary/90"
                        >
                          {isUploading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          {isUploading ? "Uploading..." : "Save Photo"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPreviewUrl(null);
                            setImageFile(null);
                          }}
                          disabled={isUploading}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Profile Form */}
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your name" {...field} />
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
                            <Input placeholder="Your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="yearsOfExperience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Years of Experience</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Years of experience"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const value =
                                  e.target.value === ""
                                    ? undefined
                                    : Number(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Your specialty category"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell clients about yourself"
                            className="resize-none h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="defaultPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Your default service price"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const value =
                                e.target.value === ""
                                  ? undefined
                                  : Number(e.target.value);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full md:w-auto"
                    disabled={updateSettings.isPending}
                  >
                    {updateSettings.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Profile
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                Update your account settings and password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Change Password</h3>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  {passwordError && (
                    <p className="text-sm font-medium text-destructive">
                      {passwordError}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handlePasswordUpdate}
                disabled={isSubmittingPassword}
              >
                {isSubmittingPassword && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Change Password
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Social & Services</CardTitle>
              <CardDescription>
                Manage your social links and service information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Social Media Links</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="instagram"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instagram</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Instagram username"
                                {...field}
                              />
                            </FormControl>
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
                                placeholder="Facebook username"
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
                                placeholder="Twitter username"
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
                              <Input placeholder="TikTok username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input placeholder="Your website URL" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Note: The specialties, services, and certificates can be implemented with more advanced components
                     like a multi-select or tag input, but for simplicity we're keeping them basic for now */}

                  <Button
                    type="submit"
                    className="w-full md:w-auto"
                    disabled={updateSettings.isPending}
                  >
                    {updateSettings.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
