import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { checkAdmin } from "@/lib/utils/auth-utils";
import { Button } from "@/components/ui/button";
import ProductForm from "@/components/admin/ProductForm";
import { ProductFormSkeleton } from "@/components/admin/loading-skeletons";

export const metadata = {
  title: "Add New Product | Admin Dashboard",
  description: "Create a new product for the store",
};

export default async function NewProductPage() {
  // Check if user is admin
  await checkAdmin();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Add New Product</h1>
        <Button variant="outline" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-950 rounded-lg shadow p-6">
        <Suspense fallback={<ProductFormSkeleton />}>
          <ProductForm />
        </Suspense>
      </div>
    </div>
  );
}
