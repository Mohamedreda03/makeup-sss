"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  BarChart3,
  Settings,
  Clock,
  Users,
  LogOut,
  Home,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  isActive: boolean;
}

function SidebarItem({ href, icon, title, isActive }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-muted",
        isActive
          ? "bg-muted font-medium text-foreground"
          : "text-muted-foreground"
      )}
    >
      {icon}
      {title}
    </Link>
  );
}

export default function ArtistDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const user = session?.user as ExtendedUser | undefined;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Navigation items
  const navItems = [
    {
      href: "/artist-dashboard",
      icon: <Home className="h-4 w-4" />,
      title: "Dashboard",
    },
    {
      href: "/artist-dashboard/appointments",
      icon: <Calendar className="h-4 w-4" />,
      title: "Appointments",
    },
    {
      href: "/artist-dashboard/availability",
      icon: <Clock className="h-4 w-4" />,
      title: "Availability",
    },
    {
      href: "/artist-dashboard/settings",
      icon: <Settings className="h-4 w-4" />,
      title: "Settings",
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col gap-4">
      <div className="px-3 py-2">
        <div className="mb-2 flex h-16 items-center rounded-lg px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="text-xl font-bold">Artist Dashboard</span>
          </Link>
        </div>
        <div className="space-y-1">
          {navItems.map((item) => (
            <SidebarItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              title={item.title}
              isActive={
                item.href === "/artist-dashboard"
                  ? pathname === "/artist-dashboard"
                  : pathname.startsWith(item.href)
              }
            />
          ))}
        </div>
      </div>
      <div className="mt-auto px-3 py-2">
        {user && (
          <div className="flex flex-col gap-2 rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.image || ""} alt={user.name || ""} />
                <AvatarFallback>
                  {user.name?.substring(0, 2) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full justify-start"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden fixed h-screen w-64 border-r bg-background md:block overflow-y-auto z-40">
        <div className="flex flex-col h-full">{sidebarContent}</div>
      </aside>

      {/* Mobile Sidebar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            {sidebarContent}
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <span className="font-semibold">Artist Dashboard</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 md:pt-0 pt-16">
        <div className="container mx-auto py-6 px-4">{children}</div>
      </main>
    </div>
  );
}
