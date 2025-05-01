import React from "react";
import Link from "next/link";
import {
  Calendar,
  BarChart3,
  Settings,
  Clock,
  Users,
  LogOut,
  Home,
  Briefcase,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ArtistDashboardNav } from "@/components/artist-dashboard/artist-dashboard-nav";

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
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-muted ${
        isActive
          ? "bg-muted font-medium text-foreground"
          : "text-muted-foreground"
      }`}
    >
      {icon}
      {title}
    </Link>
  );
}

export default async function ArtistDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // التحقق من صلاحيات المستخدم في السيرفر
  const session = await auth();

  // التحقق من أن المستخدم مسجل الدخول وهو فنان
  if (!session || session.user?.role !== "ARTIST") {
    redirect("/");
  }

  // Navigation items - defined on the server
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
      href: "/artist-dashboard/services",
      icon: <Briefcase className="h-4 w-4" />,
      title: "Services",
    },
    {
      href: "/artist-dashboard/settings",
      icon: <Settings className="h-4 w-4" />,
      title: "Settings",
    },
  ];

  // تمرير بيانات المستخدم وعناصر التنقل إلى مكون العميل
  return (
    <ArtistDashboardNav user={session.user} navItems={navItems}>
      {children}
    </ArtistDashboardNav>
  );
}
