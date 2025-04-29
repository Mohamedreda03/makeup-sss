import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";
import { toast } from "./use-toast";
import { artistSettingsSchema } from "@/lib/validations/artist-settings";
import { z } from "zod";

// Utility function to parse error message
const getErrorMessage = (error: any): string => {
  console.error("API error details:", error);

  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  if (error.message) {
    return error.message;
  }

  return "An unknown error occurred";
};

// Type for the form values
export type ArtistSettingsFormValues = z.infer<typeof artistSettingsSchema>;

interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

/**
 * Custom hook for managing artist settings with React Query
 */
export function useArtistSettings() {
  const { data: session, update: updateSession } = useSession();
  const queryClient = useQueryClient();
  const currentUser = session?.user as ExtendedUser | undefined;

  // Query to fetch artist settings
  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["artistSettings"],
    queryFn: async () => {
      try {
        const response = await axios.get("/api/artist/settings", {
          headers: {
            "Cache-Control": "no-cache",
          },
        });
        return response.data;
      } catch (error) {
        console.error("Error fetching artist settings:", error);
        // Only show toast for network errors, not for 403/404 which are expected for non-artists
        if (axios.isAxiosError(error)) {
          // Check if this is a 403 or 404 error (expected for non-artists)
          if (
            error.response?.status === 403 ||
            error.response?.status === 404
          ) {
            // This is expected for non-artists, so we'll silently fail
            // and let the UI handle the redirect
            return null;
          }

          // For other errors (500, network issues, etc), show a toast
          if (error.response?.status === 500) {
            toast({
              title: "Error",
              description:
                getErrorMessage(error) || "Failed to load artist settings",
              variant: "destructive",
            });
          }
        }
        throw error;
      }
    },
    enabled: !!session && (session.user as ExtendedUser)?.role === "ARTIST",
    refetchOnWindowFocus: false,
    retry: 1, // Only retry once to avoid hammering the server
  });

  // Mutation to update artist settings
  const updateSettings = useMutation({
    mutationFn: async (data: ArtistSettingsFormValues) => {
      return axios.put("/api/artist/settings", data);
    },
    onSuccess: async (response) => {
      // Invalidate and refetch the settings query
      await queryClient.invalidateQueries({ queryKey: ["artistSettings"] });

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
        variant: "success",
      });

      // Update NextAuth session with the new name and email if changed
      if (
        response.data.name !== currentUser?.name ||
        response.data.email !== currentUser?.email
      ) {
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            name: response.data.name,
            email: response.data.email,
          },
        });
      }
    },
    onError: (error: any) => {
      console.error("Update error:", error);
      toast({
        title: "Error",
        description:
          getErrorMessage(error) ||
          "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation to update profile image
  const updateProfileImage = useMutation({
    mutationFn: async (imageUrl: string) => {
      try {
        console.log("Updating profile image with URL:", imageUrl);

        // Update the user profile with the image URL
        const response = await axios.post("/api/user/profile-image", {
          imageUrl,
          timestamp: Date.now(), // Add timestamp for cache busting
        });

        // Invalidate cache for relevant queries
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
        queryClient.invalidateQueries({ queryKey: ["artistSettings"] });

        // Return success with cache-busting URL
        return response.data.imageUrl;
      } catch (error) {
        console.error("Image update error:", error);
        throw error;
      }
    },
    onSuccess: async (imageUrl) => {
      // Update session to reflect changes
      if (session) {
        await updateSession({
          user: {
            ...session.user,
            image: imageUrl,
          },
        });
      }

      toast({
        title: "Image Updated",
        description: "Your profile image has been updated successfully.",
        variant: "success",
      });
    },
    onError: (error: any) => {
      console.error("Image update error:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error) || "Failed to update profile image",
        variant: "destructive",
      });
    },
  });

  // Mutation to update password
  const updatePassword = useMutation({
    mutationFn: async ({ newPassword }: { newPassword: string }) => {
      try {
        const response = await axios.post("/api/user/password", {
          newPassword,
          skipCurrentPassword: true,
        });

        return response.data;
      } catch (error) {
        console.error("Password update error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
        variant: "success",
      });
    },
    onError: (error: any) => {
      console.error("Password update error:", error);
      toast({
        title: "Error",
        description: getErrorMessage(error) || "Failed to update password",
        variant: "destructive",
      });
    },
  });

  return {
    settings,
    isLoading,
    error,
    refetch,
    updateSettings,
    updateProfileImage,
    updatePassword,
    currentUser,
    updateSession,
  };
}
