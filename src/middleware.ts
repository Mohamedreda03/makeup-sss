import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  // Get the secret from environment variable
  const secret = process.env.NEXTAUTH_SECRET;

  // Debug log for the secret (don't show actual value in production)
  console.log(`Secret available: ${!!secret}`);

  try {
    // Pass the secret explicitly to ensure it's being used
    const token = await getToken({
      req,
      secret: secret,
    });

    console.log("Token:", token);

    const path = req.nextUrl.pathname;

    // Debug logs (these will show up in server logs)
    console.log(`Middleware for path: ${path}`);
    console.log(`Token present: ${!!token}`);
    console.log(`Token user: ${JSON.stringify(token?.name || "no name")}`);
    console.log(`Token role: ${token?.role || "undefined"}`);

    // If user is not authenticated, redirect to sign-in page for protected routes
    if (
      !token &&
      (path.startsWith("/admin") ||
        path.startsWith("/artist") ||
        path.startsWith("/dashboard"))
    ) {
      console.log("No token - redirecting to sign-in");
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    // For /admin routes, only allow ADMIN role
    if (path.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        // Log the issue to better understand the problem
        console.log(`Unauthorized access to admin route: ${path}`);
        console.log(`User role: ${token?.role || "undefined"}`);

        // Redirect users without admin role to the unauthorized page
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
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
  } catch (error) {
    console.error("Middleware error:", error);
    // In case of error, redirect to sign-in
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }
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
