import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Edit } from "lucide-react";
import { checkAdmin } from "@/lib/utils/auth-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const metadata = {
  title: "Product Details | Admin Dashboard",
  description: "View product details in the admin dashboard",
};

// This ensures that the page is re-fetched on each request
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getProductById(id: string) {
  try {
    // First, try to find the product directly by its database ID
    let product = await db.product.findUnique({
      where: { id },
    });

    // If not found and it looks like an external ID (prod_api_xxx format)
    if (!product && id.startsWith("prod_api_")) {
      // Try to find by name or description containing this ID
      product = await db.product.findFirst({
        where: {
          OR: [{ name: { contains: id } }, { description: { contains: id } }],
        },
      });
    }

    return product;
  } catch (error) {
    console.error("Error fetching product:", error);
    throw new Error("Failed to fetch product");
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Check if user is admin
  await checkAdmin();

  const product = await getProductById(params.id);

  if (!product) {
    notFound();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Product Details</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Link>
          </Button>
          <Button className="bg-rose-500 hover:bg-rose-600" asChild>
            <Link href={`/admin/products/${product.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Product
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Product Image</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {product.imageUrl ? (
              <div className="relative w-full aspect-square rounded-md overflow-hidden">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-full aspect-square bg-gray-200 dark:bg-gray-800 rounded-md flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">No image</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Name
                </h3>
                <p className="text-lg font-semibold">{product.name}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Price
                </h3>
                <div className="text-2xl font-bold text-gray-900">
                  EGP {product.price.toFixed(2)}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Category
                </h3>
                <p>{product.category}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Description
                </h3>
                <p className="whitespace-pre-wrap">
                  {product.description || "No description"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant={product.inStock ? "success" : "destructive"}>
                  {product.inStock ? "In Stock" : "Out of Stock"}
                </Badge>
                {product.featured && (
                  <Badge variant="secondary">Featured</Badge>
                )}
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Internal ID
                </h3>
                <p className="font-mono text-sm">{product.id}</p>
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Created
                </h3>
                <p>{format(new Date(product.createdAt), "PPP")}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Last Updated
                </h3>
                <p>{format(new Date(product.updatedAt), "PPP")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
