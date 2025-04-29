import type { Metadata } from "next";
import { checkAdmin } from "@/lib/utils/auth-utils";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
  title: "Admin Dashboard | MakeupPro",
  description: "Administrative control panel for MakeupPro",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This will redirect to sign-in if not admin
  await checkAdmin();

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 p-8">{children}</div>
    </div>
  );
}
