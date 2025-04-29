import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  // Pass the secret explicitly to ensure it's being used
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const path = req.nextUrl.pathname;

  // Debug logs (these will show up in server logs)
  console.log(`Middleware for path: ${path}`);
  console.log(`Token present: ${!!token}`);
  console.log(`Token role: ${token?.role}`);

  // If user is not authenticated, redirect to sign-in page for protected routes
  if (
    !token &&
    (path.startsWith("/admin") ||
      path.startsWith("/artist") ||
      path.startsWith("/dashboard"))
  ) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // For /admin routes, only allow ADMIN role
  if (path.startsWith("/admin") && token?.role !== "ADMIN") {
    // Log the issue to better understand the problem
    console.log(`Unauthorized access to admin route: ${path}`);
    console.log(`User role: ${token?.role}`);

    // Redirect users without admin role to the unauthorized page
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // For /artist routes, only allow ADMIN and ARTIST roles
  if (
    path.startsWith("/artist") &&
    token?.role &&
    !["ADMIN", "ARTIST"].includes(token.role as string)
  ) {
    // Redirect users without proper roles to the unauthorized page
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // For /dashboard routes, don't allow CUSTOMER role - redirect them to home
  if (path.startsWith("/dashboard") && token?.role === "CUSTOMER") {
    // Redirect regular users to the home page
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

// Specify which routes the middleware applies to
export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/artist-dashboard",
    "/artist-dashboard/:path*",
    "/artist/:path*",
    "/dashboard",
    "/dashboard/:path*",
  ],
};
