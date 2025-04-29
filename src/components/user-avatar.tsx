"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  src: string | null;
  alt: string;
  fallback: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

// Add a simpler interface for passing a user object directly
interface UserObjectAvatarProps {
  user: {
    image?: string | null;
    name?: string | null;
    email?: string | null;
  };
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function UserAvatar({
  src,
  alt,
  fallback,
  size = "md",
  className = "",
}: UserAvatarProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Define size classes
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-20 h-20",
    xl: "w-28 h-28",
  };

  // Define fallback text sizes
  const fallbackTextSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-xl",
    xl: "text-3xl",
  };

  // Optimize image URL if it's a Cloudinary URL
  const getOptimizedImageUrl = (url: string) => {
    if (!url) return undefined;

    // Check if it's a Cloudinary URL and add transformations
    if (url.includes("cloudinary.com")) {
      // Extract the base URL and add transformations
      const urlParts = url.split("/upload/");
      if (urlParts.length === 2) {
        // Add Cloudinary transformations: crop to fill, format to auto
        return `${urlParts[0]}/upload/c_fill,g_face,q_auto,f_auto/${urlParts[1]}`;
      }
    }

    // Otherwise add cache-busting
    const timestamp = Date.now();
    return `${url}${url.includes("?") ? "&" : "?"}t=${timestamp}`;
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {src && !hasError ? (
        <AvatarImage
          src={getOptimizedImageUrl(src)}
          alt={alt || "User"}
          className="object-cover"
          onLoad={() => setIsLoading(false)}
          onError={(e) => {
            console.error("Avatar image failed to load:", e);
            setHasError(true);
            setIsLoading(false);
            // Force fallback to initials
            e.currentTarget.style.display = "none";
          }}
        />
      ) : null}
      <AvatarFallback
        className={`${fallbackTextSizes[size]} bg-rose-100 text-rose-700`}
      >
        {fallback}
      </AvatarFallback>
    </Avatar>
  );
}

// Export a helper component that accepts a user object directly
export function UserObjectAvatar({
  user,
  className = "",
  size = "md",
}: UserObjectAvatarProps) {
  // Get initials from name or email
  const getInitials = () => {
    if (user.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <UserAvatar
      src={user.image || null}
      alt={user.name || "User"}
      fallback={getInitials()}
      size={size}
      className={className}
    />
  );
}
