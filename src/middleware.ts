import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Remove middleware functionality completely
// and let the layout components handle authentication
export async function middleware(req: NextRequest) {
  // Just continue to the actual page and let server components handle auth
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
