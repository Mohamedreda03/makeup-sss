"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import axios from "axios";

// Define user props interface
interface UserData {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

export function UserButton() {
  const { data: session, update } = useSession();
  const user = session?.user as UserData | undefined;
  const queryClient = useQueryClient();

  // Use state for cache busting
  const [imageVersion, setImageVersion] = useState<number>(Date.now());

  // Use ref to store temporary image for immediate UI updates
  const tempImageRef = useRef<string | null | undefined>(null);

  // Define React Query query to fetch user profile data
  const { data: userData } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      try {
        const response = await axios.get("/api/user/profile");
        return response.data;
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        return user;
      }
    },
    // Only run the query if we have a user ID
    enabled: !!user?.id,
    // Cache the data for 5 minutes
    staleTime: 1000 * 60 * 5,
  });

  // Listen for profile image update events from profile page
  useEffect(() => {
    const handleProfileImageUpdate = async (event: Event) => {
      // Cast event to CustomEvent to access detail property
      const customEvent = event as CustomEvent<{
        image: string;
        timestamp: number;
      }>;
      console.log(
        "UserButton: Profile image update event received",
        customEvent.detail
      );

      // Store the new image URL in the temp ref for immediate UI update
      if (customEvent.detail?.image) {
        tempImageRef.current = customEvent.detail.image;
      }

      // Update the cache-busting timestamp
      if (customEvent.detail?.timestamp) {
        setImageVersion(customEvent.detail.timestamp);
      }

      // Invalidate the query to refetch user data in the background
      queryClient.invalidateQueries({ queryKey: ["user-profile", user?.id] });

      // Update session without forcing reload
      try {
        await update({
          ...session,
          user: {
            ...session?.user,
            image: customEvent.detail?.image || session?.user?.image,
          },
        });
        console.log("UserButton: Session updated without reload");
      } catch (error) {
        console.error("UserButton: Failed to update session", error);
      }
    };

    // Add event listener
    window.addEventListener("profile-image-updated", handleProfileImageUpdate);

    return () => {
      // Remove event listener when component unmounts
      window.removeEventListener(
        "profile-image-updated",
        handleProfileImageUpdate
      );
    };
  }, [queryClient, update, user?.id, session]);

  // Configure image URL with cache busting
  const getImageUrl = (imageUrl: string | null | undefined) => {
    // First check if we have a temporary image from an immediate update
    if (tempImageRef.current) {
      return `${tempImageRef.current}?v=${imageVersion}`;
    }

    // Otherwise use the image from the query or session
    if (!imageUrl) return undefined;
    return `${imageUrl}?v=${imageVersion}`;
  };

  // Get the current user data, preferring the data from the query
  const currentUser = userData || user;
  // Use the temporary image ref if it exists, otherwise use the image from currentUser
  const userImage = tempImageRef.current || currentUser?.image;

  if (!user) {
    return (
      <Link
        href="/sign-in"
        className="ml-4 h-9 rounded-md bg-rose-500 px-3 text-sm font-medium text-white transition-colors hover:bg-rose-600 border-none flex items-center"
      >
        Sign In
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none">
        <div className="flex items-center gap-2 ml-4">
          <Avatar className="h-8 w-8 border border-rose-200">
            <AvatarImage
              src={getImageUrl(userImage)}
              alt={currentUser?.name || "User"}
              onError={(e) => {
                console.error("Avatar image failed to load");
                e.currentTarget.style.display = "none";
              }}
            />
            <AvatarFallback className="bg-rose-100 text-rose-800">
              {currentUser?.name ? (
                currentUser.name[0].toUpperCase()
              ) : (
                <UserCircle className="h-4 w-4" />
              )}
            </AvatarFallback>
          </Avatar>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center justify-start gap-2 p-2">
          <Avatar className="h-8 w-8 border border-rose-200">
            <AvatarImage
              src={getImageUrl(userImage)}
              alt={currentUser?.name || "User"}
            />
            <AvatarFallback className="bg-rose-100 text-rose-800">
              {currentUser?.name ? (
                currentUser.name[0].toUpperCase()
              ) : (
                <UserCircle className="h-4 w-4" />
              )}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-1 leading-none">
            {currentUser?.name && (
              <p className="font-medium">{currentUser.name}</p>
            )}
            {currentUser?.email && (
              <p className="w-[200px] truncate text-sm text-gray-500">
                {currentUser.email}
              </p>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link
            href="/profile"
            className="text-gray-700 dark:text-gray-300 hover:text-rose-500 dark:hover:text-rose-400"
          >
            Profile
          </Link>
        </DropdownMenuItem>
        {currentUser?.role === "ADMIN" && (
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link
              href="/admin"
              className="text-gray-700 dark:text-gray-300 hover:text-rose-500 dark:hover:text-rose-400"
            >
              Admin Dashboard
            </Link>
          </DropdownMenuItem>
        )}
        {currentUser?.role === "ARTIST" && (
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link
              href="/artist-dashboard"
              className="text-gray-700 dark:text-gray-300 hover:text-rose-500 dark:hover:text-rose-400"
            >
              Dashboard
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link
            href="/appointments"
            className="text-gray-700 dark:text-gray-300 hover:text-rose-500 dark:hover:text-rose-400"
          >
            My Appointments
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-rose-600 hover:text-rose-700 focus:text-rose-700"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
