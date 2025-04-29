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
  try {
    const session = await auth();

    if (!session?.user) {
      console.log("No session found, redirecting to sign-in");
      redirect("/sign-in");
    }

    // Use any as a workaround for type issues
    const user = session.user as any;

    // Add debugging
    console.log("User role:", user.role);

    if (!user.role) {
      console.log("Role is undefined, redirecting to sign-in");
      redirect("/sign-in");
    }

    if (!allowedRoles.includes(user.role)) {
      // Redirect users without proper role to the home page
      console.log(
        `Role ${user.role} not in allowed roles: ${allowedRoles.join(", ")}`
      );
      redirect("/");
    }

    return user;
  } catch (error) {
    console.error("Error in checkRole:", error);
    redirect("/sign-in");
  }
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
