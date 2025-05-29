"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface AuthRequiredProps {
  isUserLoggedIn: boolean;
}

export function AuthRequired({ isUserLoggedIn }: AuthRequiredProps) {
  if (isUserLoggedIn) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <AlertCircle className="h-6 w-6 text-amber-700" />
        <h3 className="text-xl font-semibold text-amber-800">
          Authentication Required
        </h3>
        <p className="text-amber-700 max-w-md mx-auto">
          You need to sign in to book appointments with this artist.
        </p>
        <div className="flex gap-4 mt-2">
          <Button asChild className="bg-amber-600 hover:bg-amber-700">
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-amber-200 text-amber-700 hover:bg-amber-100"
          >
            <Link href="/sign-up">Create Account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
