import Link from "next/link";
import { ArrowLeft, Edit } from "lucide-react";
import { checkAdmin } from "@/lib/utils/auth-utils";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Product Details | Admin Dashboard",
  description: "View product details in the admin dashboard",
};

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Check if user is admin
  await checkAdmin();

  if (!params.id) {
    notFound();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Product Details</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/products/${params.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Product
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Link>
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-950 rounded-lg shadow p-6">
        <p>Product details for ID: {params.id}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Product detail implementation needed
        </p>
      </div>
    </div>
  );
}
