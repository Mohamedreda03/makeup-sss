"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  Camera,
  Loader2,
  Instagram,
  Facebook,
  Twitter,
  Globe,
  Mail,
  User,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { toast } from "@/hooks/use-toast";
import axios from "axios";
import { uploadImageToCloudinary } from "@/lib/utils/cloudinary-upload";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Extended user interface for typing session.user
interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

export default function ArtistSettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const router = useRouter();

  // Fetch artist settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get("/api/artist/settings");
        console.log("Received artist settings:", response.data);
        setSettings(response.data);
      } catch (error) {
        console.error("Failed to fetch artist settings:", error);
        toast({
          title: "Error",
          description: "Failed to load settings data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsPageLoading(false);
      }
    };

    // Check if user is authenticated and is an artist
    if (session?.user) {
      const user = session.user as ExtendedUser;
      if (user.role === "ARTIST") {
        fetchSettings();
      } else {
        // Redirect non-artists
        router.push("/");
        toast({
          title: "Access Denied",
          description: "Only artists can access settings.",
          variant: "destructive",
        });
      }
    } else {
      setIsPageLoading(false);
    }
  }, [session, router]);

  const handleUpdateProfileImage = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.includes("image")) {
      toast({
        title: "Error",
        description: "Please upload a valid image file",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      setIsUploading(true);
      setUploadProgress(0);

      // Create a local preview for immediate feedback
      const localPreview = URL.createObjectURL(file);

      // Temporarily update UI with local preview
      if (session?.user) {
        session.user.image = localPreview;
        updateSession(session);
      }

      // Upload image to Cloudinary
      const imageUrl = await uploadImageToCloudinary(
        file,
        `profile-images/${(session?.user as ExtendedUser)?.id || "user"}`,
        (progress: number) => {
          setUploadProgress(progress);
        }
      );

      // Revoke the local preview URL to avoid memory leaks
      URL.revokeObjectURL(localPreview);

      // Update image URL in database
      const response = await fetch("/api/user/profile-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl,
          timestamp: Date.now(), // Add timestamp for cache busting
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile image");
      }

      // Update session to reflect changes
      if (session) {
        await updateSession({
          user: {
            ...session.user,
            image: imageUrl,
          },
        });

        toast({
          title: "Image Updated",
          description: "Your profile image has been updated successfully.",
          variant: "success",
        });

        // Reload the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error("Error updating profile image:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while updating your profile image",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setIsUploading(false);
      }, 500);
    }
  };

  const handleUpdatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/user/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPassword,
          skipCurrentPassword: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update password");
      }

      setNewPassword("");
      setConfirmPassword("");

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error updating password:", error);
      setPasswordError(
        error instanceof Error
          ? error.message
          : "An error occurred while updating your password"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (formData: any) => {
    setIsLoading(true);

    try {
      const requestData = {
        name: formData.name || "",
        email: formData.email || "",
        bio: formData.bio || "",
        instagram: formData.instagram || "",
        facebook: formData.facebook || "",
        twitter: formData.twitter || "",
        website: formData.website || "",
        defaultPrice: formData.defaultPrice
          ? parseFloat(formData.defaultPrice)
          : null,
      };

      console.log("Updating artist profile with:", requestData);
      const response = await axios.put("/api/artist/settings", requestData);

      setSettings((prev: any) => ({
        ...prev,
        ...requestData,
      }));

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
        variant: "success",
      });
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Data Error</AlertTitle>
          <AlertDescription>
            Unable to load settings data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground mt-1">
            Update your personal information and password
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Image */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile Image</CardTitle>
            <CardDescription>Update your profile picture</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative mb-4">
              <Avatar className="h-32 w-32">
                <AvatarImage
                  src={session?.user?.image || ""}
                  alt={session?.user?.name || "User"}
                />
                <AvatarFallback>
                  {session?.user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0">
                <label
                  htmlFor="image-upload"
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
                >
                  <Camera className="h-5 w-5" />
                  <span className="sr-only">Upload image</span>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpdateProfileImage}
                    disabled={isLoading}
                  />
                </label>
              </div>
            </div>

            {isUploading && (
              <div className="w-full mt-4">
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-center text-sm mt-1">
                  {Math.round(uploadProgress)}%
                </p>
              </div>
            )}

            <div className="text-sm text-muted-foreground mt-2 text-center">
              JPG, GIF or PNG. Max size 5MB.
            </div>
          </CardContent>
        </Card>

        {/* Profile Info and Password */}
        <div className="md:col-span-2">
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your basic and social media details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BasicInfoForm
                  onSubmit={handleUpdateProfile}
                  settings={settings}
                  user={session?.user as ExtendedUser}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>

            {/* Password Change */}
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  {passwordError && (
                    <Alert variant="destructive">
                      <AlertDescription>{passwordError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
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
                      required
                    />
                  </div>

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function BasicInfoForm({
  onSubmit,
  settings,
  user,
  isLoading,
}: {
  onSubmit: (data: any) => void;
  settings: any;
  user: ExtendedUser;
  isLoading: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      bio: settings.bio || "",
      instagram: settings.instagram || "",
      facebook: settings.facebook || "",
      twitter: settings.twitter || "",
      website: settings.website || "",
      defaultPrice: settings.defaultPrice || "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <User className="h-4 w-4" /> Name
          </Label>
          <Input id="name" placeholder="Your full name" {...register("name")} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Your email address"
            {...register("email")}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="defaultPrice">Default Price (EGP)</Label>
          <Input
            id="defaultPrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="Your default service price"
            {...register("defaultPrice")}
          />
          <p className="text-xs text-muted-foreground">
            The default price for your services in Egyptian Pound
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            placeholder="Tell clients about yourself and your expertise..."
            className="min-h-[120px]"
            {...register("bio")}
          />
          <p className="text-xs text-muted-foreground">
            Max 1000 characters. This will be displayed on your public profile.
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <h3 className="text-lg font-medium">Social Media</h3>

          <div className="grid gap-2">
            <Label htmlFor="instagram" className="flex items-center gap-2">
              <Instagram className="h-4 w-4" /> Instagram
            </Label>
            <Input
              id="instagram"
              placeholder="Your Instagram handle"
              {...register("instagram")}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="facebook" className="flex items-center gap-2">
              <Facebook className="h-4 w-4" /> Facebook
            </Label>
            <Input
              id="facebook"
              placeholder="Your Facebook profile or page"
              {...register("facebook")}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="twitter" className="flex items-center gap-2">
              <Twitter className="h-4 w-4" /> Twitter
            </Label>
            <Input
              id="twitter"
              placeholder="Your Twitter handle"
              {...register("twitter")}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="h-4 w-4" /> Website
            </Label>
            <Input
              id="website"
              type="url"
              placeholder="https://your-website.com"
              {...register("website")}
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Changes"
        )}
      </Button>
    </form>
  );
}
