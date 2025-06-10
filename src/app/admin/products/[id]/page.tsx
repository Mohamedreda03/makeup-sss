import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Edit, Package, DollarSign, Tag, Hash } from "lucide-react";
import { checkAdmin } from "@/lib/utils/auth-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "Product Details | Admin Dashboard",
  description: "View product details in the admin dashboard",
};

// Fetch product data
async function getProduct(id: string) {
  try {
    const product = await db.product.findUnique({
      where: { id },
    });
    return product;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

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

  // Fetch product data
  const product = await getProduct(params.id);

  if (!product) {
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Product Image */}
        <Card>
          <CardHeader>
            <CardTitle>Product Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-square relative border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Package className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Product Information */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {product.name}
                {product.featured && (
                  <Badge variant="secondary">Featured</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Description */}
              {product.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Description
                  </h3>
                  <p className="text-gray-900 dark:text-gray-100">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Product Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Price
                    </p>
                    <p className="font-semibold">${product.price}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Hash className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Stock
                    </p>
                    <p className="font-semibold">
                      {product.stock_quantity || 0}
                    </p>
                  </div>
                </div>

                {product.category && (
                  <div className="flex items-center space-x-2">
                    <Tag className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Category
                      </p>
                      <p className="font-semibold">{product.category}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Status
                    </p>
                    <Badge
                      variant={
                        (product.stock_quantity || 0) > 0
                          ? "default"
                          : "destructive"
                      }
                    >
                      {(product.stock_quantity || 0) > 0
                        ? "In Stock"
                        : "Out of Stock"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div>
                    <p>
                      Created:{" "}
                      {new Date(product.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p>
                      Updated:{" "}
                      {new Date(product.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
