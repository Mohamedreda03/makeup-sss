import { NextRequest, NextResponse } from "next/server";
import { auth } from "./lib/auth";
import { UserRole } from "@/generated/prisma";

// Add type definition
interface CustomUser {
  role?: string;
  [key: string]: any;
}

export default auth((req) => {
  // Use type assertion to fix the error
  const user = req.auth?.user as CustomUser | undefined;
  const path = req.nextUrl.pathname;

  // If no user is authenticated and trying to access protected routes
  if (
    !user &&
    (path.startsWith("/admin") || path.startsWith("/artist-dashboard"))
  ) {
    // Redirect to sign-in page
    return NextResponse.redirect(new URL("/sign-in", req.nextUrl));
  }

  // Admin routes - Only ADMIN role allowed
  if (path.startsWith("/admin")) {
    if (user?.role === UserRole.ADMIN) {
      return NextResponse.next();
    }
    // Redirect non-admin users to unauthorized page
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // Artist dashboard - Only ARTIST and ADMIN roles allowed
  if (path.startsWith("/artist-dashboard")) {
    if (user?.role === UserRole.ARTIST || user?.role === UserRole.ADMIN) {
      return NextResponse.next();
    }
    // Redirect non-artist users to unauthorized page
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // For all other routes, proceed normally
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
