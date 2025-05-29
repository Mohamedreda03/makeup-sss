"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useArtistSettings } from "@/hooks/use-artist-settings";
import {
  PasswordUpdateFormValues,
  ArtistSettingsFormValues,
} from "@/lib/validations/artist-settings";
import { Separator } from "@/components/ui/separator";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useQueryClient } from "@tanstack/react-query";

// Import our custom components
import { ArtistProfileForm } from "@/components/forms/ArtistProfileForm";
import { PasswordUpdateForm } from "@/components/forms/PasswordUpdateForm";
import { ProfileImageUpload } from "@/components/artist/ProfileImageUpload";

export default function ArtistSettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch artist settings and user data with React Query
  const {
    settings,
    isLoading,
    updateSettings,
    updateProfileImage,
    updatePassword,
    currentUser,
  } = useArtistSettings();

  const { currentUser: freshUserData, refreshUserData } = useCurrentUser();

  // Redirect if not an artist
  if (!isLoading && currentUser && !settings && currentUser.role !== "ARTIST") {
    router.push("/profile");
    return null;
  }

  // Handle profile image upload
  const handleImageUploaded = async (imageUrl: string) => {
    try {
      // Update the profile image in the database
      await updateProfileImage.mutateAsync(imageUrl);

      // Force refresh all relevant data
      await refreshUserData();
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      queryClient.invalidateQueries({ queryKey: ["artistSettings"] });

      // Force rerender components that use the image
      setTimeout(() => {
        toast({
          title: "Profile Image Updated",
          description: "Your profile image has been updated successfully.",
          
        });
      }, 100);
    } catch {
      toast({
        title: "Error",
        description: "Failed to update profile image.",
        variant: "destructive",
      });
    }
  };

  // Handle settings form submission
  const handleSettingsSubmit = (data: ArtistSettingsFormValues) => {
    updateSettings.mutate(data, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["artistSettings"] });
        queryClient.invalidateQueries({ queryKey: ["user-profile"] });
        toast({
          title: "Settings Updated",
          description: "Your settings have been updated successfully.",
          
        });
      },
    });
  };

  // Handle password update
  const handlePasswordSubmit = (data: PasswordUpdateFormValues) => {
    updatePassword.mutate(
      { newPassword: data.newPassword },
      {
        onSuccess: () => {
          toast({
            title: "Password Updated",
            description: "Your password has been changed successfully.",
            
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Artist Settings</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
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
              {/* Profile Image Component */}
              <ProfileImageUpload
                userImage={freshUserData?.image || currentUser?.image}
                userName={freshUserData?.name || currentUser?.name}
                onImageUploaded={handleImageUploaded}
              />

              <Separator />

              {/* Profile Form Component */}
              <ArtistProfileForm
                defaultValues={settings || {}}
                onSubmit={handleSettingsSubmit}
                isSubmitting={updateSettings.isPending}
              />
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
                {/* Password Form Component */}
                <PasswordUpdateForm
                  onSubmit={handlePasswordSubmit}
                  isSubmitting={updatePassword.isPending}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
