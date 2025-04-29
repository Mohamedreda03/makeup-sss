"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Users,
  Calendar,
  Settings,
  LogOut,
  UserCog,
  ShoppingBag,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function AdminSidebar() {
  const pathname = usePathname();

  const routes = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: "/admin",
      active: pathname === "/admin",
    },
    {
      label: "Products",
      icon: <Package className="h-5 w-5" />,
      href: "/admin/products",
      active:
        pathname === "/admin/products" ||
        pathname.startsWith("/admin/products/"),
    },
    {
      label: "Artists",
      icon: <UserCog className="h-5 w-5" />,
      href: "/admin/artists",
      active:
        pathname === "/admin/artists" || pathname.startsWith("/admin/artists/"),
    },
    {
      label: "Customers",
      icon: <Users className="h-5 w-5" />,
      href: "/admin/customers",
      active: pathname === "/admin/customers",
    },
    {
      label: "Orders",
      icon: <ShoppingBag className="h-5 w-5" />,
      href: "/admin/orders",
      active:
        pathname === "/admin/orders" || pathname.startsWith("/admin/orders/"),
    },
    {
      label: "Appointments",
      icon: <Calendar className="h-5 w-5" />,
      href: "/admin/appointments",
      active: pathname === "/admin/appointments",
    },
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 h-screen sticky top-0">
      <div className="p-6">
        <Link href="/admin" className="flex items-center space-x-2">
          <span className="text-xl font-bold">
            Admin<span className="text-rose-500">Panel</span>
          </span>
        </Link>
      </div>

      <div className="mt-2 px-3 space-y-1">
        {routes.map((route) => (
          <Link href={route.href} key={route.href}>
            <div
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                route.active
                  ? "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              {route.icon}
              <span>{route.label}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="absolute bottom-0 w-full p-6">
        <Button
          variant="outline"
          className="w-full flex items-center space-x-2 border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/20"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </Button>
        <div className="mt-4 text-center text-xs text-gray-500">
          MakeupPro Admin v1.0
        </div>
      </div>
    </div>
  );
}
