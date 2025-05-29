"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { AlertCircle, Camera, Check, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { toast } from "@/hooks/use-toast";
import axios from "axios";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { uploadImageToCloudinary } from "@/lib/utils/cloudinary-upload";
import { UserAvatar } from "@/components/user-avatar";

// Definir la interfaz para los datos del usuario
interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  image: string | null;
  role: string;
  createdAt: string;
}

// Definir el componente de la página de perfil
function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get("/api/user/profile");
        console.log("Received user data:", response.data);
        setUserData(response.data);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsPageLoading(false);
      }
    };

    if (session?.user) {
      fetchUserData();
    } else {
      setIsPageLoading(false);
    }
  }, [session]);
  const handleUpdateProfile = async (formData: any) => {
    setIsLoading(true);
    setSuccessMessage("");

    try {
      console.log("Form data being submitted:", formData);

      // Create request data with proper typing
      const requestData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || "",
        address: formData.address || "",
      };

      console.log("Sending profile update with data:", requestData);
      const response = await axios.put("/api/user/profile", requestData);

      // Update local user data with response
      setUserData(response.data);
      console.log("API Response with updated user data:", response.data);

      // Update session to reflect changes
      if (session) {
        await updateSession({
          ...session,
          user: {
            ...session.user,
            name: formData.name,
            email: formData.email,
          },
        });
      }

      setSuccessMessage("Profile information updated successfully!");
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
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

  const handleUpdatePassword = async (formData: any) => {
    setIsLoading(true);
    setSuccessMessage("");

    try {
      console.log("Sending password update request with data:", {
        newPasswordLength: formData.newPassword?.length,
      });

      await axios.put("/api/user/password", {
        newPassword: formData.newPassword,
      });

      setSuccessMessage("Password updated successfully!");
      toast({
        title: "Password Updated",
        description: "Your password has been updated successfully.",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Failed to update password:", error);
      console.log("Error response:", error.response?.data);

      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfileImage = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log(
      "Selected file:",
      file.name,
      "Type:",
      file.type,
      "Size:",
      file.size
    );

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
      setIsLoading(true); // Set loading state to disable button
      setIsUploading(true); // Show progress bar
      setUploadProgress(0); // Reset progress bar

      // Create a local preview for immediate feedback
      const localPreview = URL.createObjectURL(file);
      console.log("Created local preview:", localPreview);

      // Temporarily update UI with local preview for better UX
      setUserData((prev) => ({
        ...prev!,
        image: localPreview,
      }));

      // 1. Upload image to Cloudinary
      console.log("Starting Cloudinary upload...");
      const imageUrl = await uploadImageToCloudinary(
        file,
        `profile-images/${userData?.id || "user"}`,
        (progress: number) => {
          console.log("Upload progress:", progress);
          setUploadProgress(progress);
        }
      );
      console.log("Cloudinary upload complete, URL:", imageUrl);

      // Revoke the local preview URL to avoid memory leaks
      URL.revokeObjectURL(localPreview);

      // 2. Update image URL in database using fetch API
      console.log("Updating database with new image URL...");
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

      console.log("API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error:", errorData);
        throw new Error(errorData.message || "Failed to update profile image");
      }

      const data = await response.json();
      console.log("API response data:", data);

      // 3. Update user data locally with the permanent URL
      setUserData((prev) => ({
        ...prev!,
        image: imageUrl,
      }));

      // 4. Update session to reflect changes
      if (session) {
        console.log("Updating session with new image URL...");
        try {
          // Update session once
          await updateSession({
            user: {
              ...session.user,
              image: imageUrl,
            },
          });

          // Show success message to user
          toast({
            title: "Image Updated",
            description:
              "Your profile image has been updated successfully. Refreshing page...",
          });

          // Simplest solution: reload the current page after a short delay
          // This will fetch the updated data from the server and update the navbar
          setTimeout(() => {
            window.location.reload();
          }, 2000); // Short delay

          console.log("Session updated successfully");
        } catch (sessionError) {
          console.error("Error updating session:", sessionError);
        }
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

      // Revert to original image if there was an error
      if (userData) {
        console.log("Reverting to original image due to error");
        setUserData((prev) => ({
          ...prev!,
          image: userData.image,
        }));
      }
    } finally {
      setIsLoading(false); // End loading state

      // Hide progress bar after a short delay
      setTimeout(() => {
        setIsUploading(false);
      }, 500);
    }
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>
            Unable to load profile data. Please sign in to access your profile.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const joinDate = new Date(userData.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-800">My Profile</h1>
        <p className="text-lg text-gray-600 mt-2">
          Manage your personal information and account settings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* User Profile Summary Card */}
        <div className="md:col-span-1">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-col items-center pb-5">
              <div className="relative mb-4">
                <UserAvatar
                  src={userData.image}
                  alt={userData.name || "User"}
                  fallback={
                    userData.name ? userData.name.charAt(0).toUpperCase() : "U"
                  }
                  size="xl"
                />
                <label
                  className={`absolute bottom-0 right-0 bg-rose-600 text-white p-2 rounded-full hover:bg-rose-700 transition-colors cursor-pointer ${
                    isLoading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpdateProfileImage}
                    disabled={isLoading}
                  />
                </label>
              </div>

              {isUploading && (
                <div className="w-full mb-4">
                  <ProgressIndicator progress={uploadProgress} />
                </div>
              )}

              <CardTitle className="text-xl font-bold text-center">
                <span className="truncate block max-w-full">
                  {userData.name || "User"}
                </span>
              </CardTitle>
              <CardDescription className="text-center text-base">
                Member since {joinDate}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-base text-gray-500 pt-2">
              <div className="flex flex-col space-y-5">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Email:</span>
                  <span className="text-gray-800 truncate max-w-[150px]">
                    {userData.email}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Phone:</span>
                  <span className="text-gray-800 truncate max-w-[150px]">
                    {userData.phone || "Not provided"}
                  </span>
                </div>{" "}
                <div className="flex justify-between items-center">
                  <span className="font-medium">Address:</span>
                  <span className="text-gray-800 truncate max-w-[150px]">
                    {userData.address || "Not provided"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Settings Tabs */}
        <div className="md:col-span-3">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="w-full mb-8 bg-white border-b border-gray-200 p-0">
              <TabsTrigger
                value="personal"
                className="py-4 px-6 text-base data-[state=active]:border-b-2 data-[state=active]:border-rose-500 data-[state=active]:text-rose-700 rounded-none bg-transparent font-medium"
              >
                Profile Information
              </TabsTrigger>
              <TabsTrigger
                value="password"
                className="py-4 px-6 text-base data-[state=active]:border-b-2 data-[state=active]:border-rose-500 data-[state=active]:text-rose-700 rounded-none bg-transparent font-medium"
              >
                Change Password
              </TabsTrigger>
            </TabsList>{" "}
            {/* Personal Information Tab */}
            <TabsContent value="personal" className="mt-0">
              <PersonalInfoForm
                onSubmit={handleUpdateProfile}
                userData={userData}
                isLoading={isLoading}
              />

              {successMessage && (
                <Alert className="mt-6 bg-green-50 text-green-800 border-green-200">
                  <Check className="h-5 w-5" />
                  <AlertTitle className="text-base font-medium">
                    Success
                  </AlertTitle>
                  <AlertDescription className="text-sm">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
            {/* Password Tab */}
            <TabsContent value="password" className="mt-0">
              <PasswordForm
                onSubmit={handleUpdatePassword}
                isLoading={isLoading}
              />

              {successMessage && (
                <Alert className="mt-6 bg-green-50 text-green-800 border-green-200">
                  <Check className="h-5 w-5" />
                  <AlertTitle className="text-base font-medium">
                    Success
                  </AlertTitle>
                  <AlertDescription className="text-sm">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
function PersonalInfoForm({
  onSubmit,
  userData,
  isLoading,
}: {
  onSubmit: any;
  userData: UserData;
  isLoading: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: userData.name || "",
      email: userData.email || "",
      phone: userData.phone || "",
      address: userData.address || "",
    },
  });

  // Create a wrapped submit handler
  const handleFormSubmit = (formData: any) => {
    console.log("Form submitted with data:", formData);
    onSubmit(formData);
  };

  return (
    <Card className="overflow-hidden">
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        {" "}
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            Profile Information
          </CardTitle>
          <CardDescription className="text-gray-600">
            Update your personal details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="name" className="text-base font-medium">
              Full Name
            </Label>
            <Input
              id="name"
              className="h-12 text-base px-4"
              {...register("name", { required: "Name is required" })}
              placeholder="Your full name"
            />
            {errors.name && (
              <p className="text-sm text-red-500 truncate">
                {errors.name.message?.toString()}
              </p>
            )}
          </div>
          <div className="space-y-3">
            <Label htmlFor="email" className="text-base font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              className="h-12 text-base px-4"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: "Please enter a valid email address",
                },
              })}
              placeholder="Your email address"
            />
            {errors.email && (
              <p className="text-sm text-red-500 truncate">
                {errors.email.message?.toString()}
              </p>
            )}
          </div>{" "}
          <div className="space-y-3">
            <Label htmlFor="phone" className="text-base font-medium">
              Phone Number
            </Label>
            <Input
              id="phone"
              className="h-12 text-base px-4"
              {...register("phone", {
                pattern: {
                  value:
                    /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
                  message: "Please enter a valid phone number",
                },
              })}
              placeholder="Your phone number"
            />
            {errors.phone && (
              <p className="text-sm text-red-500 truncate">
                {errors.phone.message?.toString()}
              </p>
            )}
          </div>
          <div className="space-y-3">
            <Label htmlFor="address" className="text-base font-medium">
              Address
            </Label>
            <Input
              id="address"
              className="h-12 text-base px-4"
              {...register("address")}
              placeholder="Your address"
            />
          </div>
          <Alert
            variant="destructive"
            className="bg-amber-50 text-amber-800 border-amber-200"
          >
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-base font-medium">Important</AlertTitle>
            <AlertDescription className="text-sm">
              Make sure your email is correct as it will be used for account
              recovery and notifications.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-between py-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 px-6 text-base ml-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function PasswordForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: any;
  isLoading: boolean;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = watch("newPassword");

  return (
    <Card className="overflow-hidden">
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Change Password</CardTitle>
          <CardDescription className="text-gray-600">
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="newPassword" className="text-base font-medium">
              New Password
            </Label>
            <Input
              id="newPassword"
              type="password"
              className="h-12 text-base px-4"
              {...register("newPassword", {
                required: "New password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters long",
                },
              })}
              placeholder="Enter your new password"
            />
            {errors.newPassword && (
              <p className="text-sm text-red-500 truncate">
                {errors.newPassword.message?.toString()}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="confirmPassword" className="text-base font-medium">
              Confirm New Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              className="h-12 text-base px-4"
              {...register("confirmPassword", {
                required: "Please confirm your new password",
                validate: (value) =>
                  value === newPassword || "Passwords do not match",
              })}
              placeholder="Confirm your new password"
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500 truncate">
                {errors.confirmPassword.message?.toString()}
              </p>
            )}
          </div>

          <Alert
            variant="destructive"
            className="bg-amber-50 text-amber-800 border-amber-200"
          >
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-base font-medium">
              Password Requirements
            </AlertTitle>
            <AlertDescription className="text-sm">
              <ul className="list-disc pl-4 mt-2">
                <li>At least 8 characters long</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-end py-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 px-6 text-base"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

// Exportar el componente ProfilePage como default
export default ProfilePage;
