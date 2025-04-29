import type { Metadata } from "next";
import { checkAdmin } from "@/lib/utils/auth-utils";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

// تعطيل التخزين المؤقت وإجبار إعادة جلب البيانات في كل زيارة
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Admin Dashboard | MakeupPro",
  description: "Administrative control panel for MakeupPro",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 p-8">{children}</div>
    </div>
  );
}
