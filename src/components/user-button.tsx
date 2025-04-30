"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
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

export function UserButton({ session }: { session: any }) {
  const user = session?.user as UserData | undefined;

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
  });

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
              src={userData?.image}
              alt={userData?.name || "User"}
              onError={(e) => {
                console.error("Avatar image failed to load");
                e.currentTarget.style.display = "none";
              }}
            />
            <AvatarFallback className="bg-rose-100 text-rose-800">
              {userData?.name ? (
                userData.name[0].toUpperCase()
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
            <AvatarImage src={userData} alt={userData?.name || "User"} />
            <AvatarFallback className="bg-rose-100 text-rose-800">
              {userData?.name ? (
                userData.name[0].toUpperCase()
              ) : (
                <UserCircle className="h-4 w-4" />
              )}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-1 leading-none">
            {userData?.name && <p className="font-medium">{userData.name}</p>}
            {userData?.email && (
              <p className="w-[200px] truncate text-sm text-gray-500">
                {userData.email}
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
        {session?.user?.role === "ADMIN" && (
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link
              href="/admin"
              className="text-gray-700 dark:text-gray-300 hover:text-rose-500 dark:hover:text-rose-400"
            >
              Admin Dashboard
            </Link>
          </DropdownMenuItem>
        )}
        {session?.user?.role === "ARTIST" && (
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
