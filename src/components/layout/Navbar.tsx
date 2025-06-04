import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import NavbarClient from "./NavbarClient";

export default async function Navbar() {
  // Get user session
  const session = await auth();

  // Route information
  const routes = [
    {
      href: "/",
      label: "Home",
      active: false, // Will be updated on client side
    },
    {
      href: "/artists",
      label: "Artists",
      active: false,
    },
    {
      href: "/products",
      label: "Products",
      active: false,
    },
    {
      href: "/about",
      label: "About",
      active: false,
    },
  ];
  // If user is logged in, get their updated data from database
  let userData = null;

  if (session?.user?.id) {
    try {
      // Get updated user data from database
      const user = await db.user.findUnique({
        where: {
          id: session.user.id as string,
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
      });

      if (user) {
        userData = {
          ...user, // Add timestamp parameter to prevent image caching
          image: user.image ? `${user.image}` : null,
        };
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Use session data as fallback in case of query failure
      userData = session.user;
    }
  }

  // تمرير البيانات إلى مكون العميل
  return <NavbarClient user={userData} routes={routes} />;
}
