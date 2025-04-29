import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { checkAdmin } from "@/lib/utils/auth-utils";
import { Button } from "@/components/ui/button";
import ArtistsTable from "@/components/admin/ArtistsTable";
import { ArtistsTableSkeleton } from "@/components/admin/loading-skeletons";

export const metadata = {
  title: "Manage Artists | Admin Dashboard",
  description: "Manage your artists in the admin dashboard",
};

export default async function ArtistsPage({
  searchParams,
}: {
  searchParams: {
    query?: string;
    page?: string;
    limit?: string;
    sort?: string;
  };
}) {
  // Check if user is admin
  await checkAdmin();

  const query = searchParams.query || "";
  const currentPage = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 10;
  const sort = searchParams.sort || "createdAt:desc";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Artists Management</h1>
        <Button className="bg-rose-500 hover:bg-rose-600" asChild>
          <Link href="/admin/artists/new">
            <Plus className="mr-2 h-4 w-4" />
            Add New Artist
          </Link>
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-950 rounded-lg shadow p-6 mb-6">
        <Suspense fallback={<ArtistsTableSkeleton />}>
          <ArtistsTable
            query={query}
            currentPage={currentPage}
            pageSize={limit}
            sort={sort}
          />
        </Suspense>
      </div>
    </div>
  );
}
