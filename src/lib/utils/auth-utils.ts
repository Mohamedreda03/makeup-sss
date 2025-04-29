import { auth } from "@/lib/auth";
import { UserRole } from "@/generated/prisma";
import { redirect } from "next/navigation";

export const isAuthenticated = async () => {
  const session = await auth();
  return !!session?.user;
};

export const getCurrentUser = async () => {
  const session = await auth();
  return session?.user;
};

export const checkRole = async (allowedRoles: UserRole[]) => {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Use any as a workaround for type issues
  const user = session.user as any;

  if (!allowedRoles.includes(user.role)) {
    // Redirect users without proper role to the home page
    redirect("/");
  }

  return user;
};

// Only Admin can access
export const checkAdmin = async () => {
  return checkRole([UserRole.ADMIN]);
};

// Only Admin and Artist can access
export const checkArtist = async () => {
  return checkRole([UserRole.ARTIST, UserRole.ADMIN]);
};

// Only Admin and Artist can access dashboard
export const checkDashboardAccess = async () => {
  return checkRole([UserRole.ARTIST, UserRole.ADMIN]);
};

// All authenticated users can access public pages
export const checkCustomer = async () => {
  return checkRole([UserRole.CUSTOMER, UserRole.ARTIST, UserRole.ADMIN]);
};
