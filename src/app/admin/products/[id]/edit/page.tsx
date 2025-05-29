import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { checkAdmin } from "@/lib/utils/auth-utils";
import { Button } from "@/components/ui/button";
import ProductForm from "@/components/admin/ProductForm";
import { ProductFormSkeleton } from "@/components/admin/loading-skeletons";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Edit Product | Admin Dashboard",
  description: "Edit an existing product in the admin dashboard",
};

export default async function EditProductPage({
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
        <h1 className="text-3xl font-bold">Edit Product</h1>
        <Button variant="outline" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-950 rounded-lg shadow p-6">
        <Suspense fallback={<ProductFormSkeleton />}>
          <ProductForm productId={params.id} />
        </Suspense>
      </div>
    </div>
  );
}
