"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCircle, ShoppingCart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/useCartStore";

// تعريف واجهة بيانات المستخدم
interface UserProps {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

// تعريف واجهة الخصائص المطلوبة للمكون
interface NavbarClientProps {
  user: UserProps | null;
  routes: {
    href: string;
    label: string;
    active: boolean;
  }[];
}

export default function NavbarClient({ user, routes }: NavbarClientProps) {
  const pathname = usePathname();
  const { update } = useSession();
  const [imageVersion, setImageVersion] = useState<number>(Date.now());
  const [userImage, setUserImage] = useState<string | null | undefined>(
    user?.image
  );

  // Use Zustand store for cart count with hydration handling
  const cartItemCount = useCartStore((state) => state.itemCount);
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // تحديث الصورة عندما تتغير بيانات المستخدم من الخادم
  useEffect(() => {
    setUserImage(user?.image);
  }, [user?.image]);

  // الاستماع لحدث تحديث الصورة من صفحة الملف الشخصي
  useEffect(() => {
    const handleProfileImageUpdate = async (event: Event) => {
      // تحويل نوع الحدث إلى CustomEvent للوصول إلى خاصية detail
      const customEvent = event as CustomEvent<{
        image: string;
        timestamp: number;
      }>;
      console.log(
        "NavbarClient: تم استلام حدث تحديث الصورة الشخصية",
        customEvent.detail
      );

      // تحديث الصورة فورًا في واجهة المستخدم
      if (customEvent.detail?.image) {
        setUserImage(customEvent.detail.image);
        // تحديث رقم النسخة لكسر التخزين المؤقت للصورة
        setImageVersion(customEvent.detail.timestamp || Date.now());
        console.log("NavbarClient: تم تحديث الصورة في واجهة المستخدم");
      }

      // استخدام تقنية SWR لإعادة التحقق من صحة المسار الحالي
      try {
        // استدعاء API لتحديث كاش الخادم
        const response = await fetch("/api/navbar/refresh-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageUrl: customEvent.detail?.image || user?.image,
            timestamp: Date.now(),
          }),
        });

        if (response.ok) {
          console.log("NavbarClient: تم تحديث كاش الخادم بنجاح");

          // إعادة تحميل بيانات الجلسة بعد تأكيد تحديث الكاش
          await update();
          console.log("NavbarClient: تم تحديث بيانات الجلسة");
        }
      } catch (error) {
        console.error("NavbarClient: فشل في تحديث البيانات على الخادم", error);
      }
    };

    // إضافة مستمع الحدث
    window.addEventListener("profile-image-updated", handleProfileImageUpdate);

    return () => {
      // إزالة مستمع الحدث عند تفكيك المكوّن
      window.removeEventListener(
        "profile-image-updated",
        handleProfileImageUpdate
      );
    };
  }, [update, user?.image]);

  // تعيين حالة التنشيط للطرق بناءً على المسار الحالي
  const updatedRoutes = routes.map((route) => ({
    ...route,
    active: pathname === route.href,
  }));

  // تكوين عنوان URL للصورة مع منع التخزين المؤقت
  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return undefined;
    return `${imageUrl}?v=${imageVersion}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-rose-100/40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-950/95 dark:border-gray-800/40">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="text-xl font-bold">
              Makeup<span className="text-rose-500">Pro</span>
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {updatedRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "transition-colors hover:text-rose-500",
                  route.active
                    ? "text-rose-600 font-semibold"
                    : "text-gray-600 dark:text-gray-400"
                )}
              >
                {route.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <nav className="flex items-center md:hidden">
              <Link href="/" className="mr-6 flex items-center space-x-2">
                <span className="text-xl font-bold">
                  Makeup<span className="text-rose-500">Pro</span>
                </span>
              </Link>
            </nav>
          </div>
          <div className="flex items-center">
            <Link href="/cart">
              <Button
                variant="ghost"
                size="icon"
                className="relative text-foreground"
              >
                <ShoppingCart className="h-[1.2rem] w-[1.2rem]" />
                {mounted && cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-medium text-white">
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </span>
                )}
                <span className="sr-only">Cart</span>
              </Button>
            </Link>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none">
                  <div className="flex items-center gap-2 ml-4">
                    <Avatar className="h-8 w-8 border border-rose-200">
                      <AvatarImage
                        src={getImageUrl(userImage)}
                        alt={user.name || "User"}
                        onError={(e) => {
                          console.error("Navbar avatar image failed to load");
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <AvatarFallback className="bg-rose-100 text-rose-800">
                        {user.name ? (
                          user.name[0].toUpperCase()
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
                      <AvatarImage
                        src={getImageUrl(userImage)}
                        alt={user.name || "User"}
                      />
                      <AvatarFallback className="bg-rose-100 text-rose-800">
                        {user.name ? (
                          user.name[0].toUpperCase()
                        ) : (
                          <UserCircle className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1 leading-none">
                      {user.name && <p className="font-medium">{user.name}</p>}
                      {user.email && (
                        <p className="w-[200px] truncate text-sm text-gray-500">
                          {user.email}
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
                  {user.role === "ADMIN" && (
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link
                        href="/admin"
                        className="text-gray-700 dark:text-gray-300 hover:text-rose-500 dark:hover:text-rose-400"
                      >
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === "ARTIST" && (
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
            ) : (
              <Link
                href="/sign-in"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "ml-4 bg-rose-500 text-white hover:bg-rose-600 border-none"
                )}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
