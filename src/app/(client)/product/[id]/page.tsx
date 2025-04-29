import { Suspense } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Loader2,
  ChevronLeft,
  ShoppingCart,
  Heart,
  Truck,
  Package2,
  RefreshCw,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import ProductAddToCartClient from "@/components/product/ProductAddToCartClient";

// Disable caching to ensure fresh data on each request
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ProductPageProps {
  params: {
    id: string;
  };
}

async function getProduct(id: string) {
  try {
    const product = await db.product.findUnique({
      where: { id },
    });

    if (!product) {
      return null;
    }

    return product;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

async function getRelatedProducts(
  categoryName: string,
  productId: string,
  limit = 4
) {
  try {
    const products = await db.product.findMany({
      where: {
        category: categoryName,
        id: { not: productId },
        inStock: true,
      },
      take: limit,
    });

    return products;
  } catch (error) {
    console.error("Error fetching related products:", error);
    return [];
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(
    product.category,
    product.id
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center mb-8 text-sm">
          <Link
            href="/products"
            className="text-gray-600 hover:text-rose-500 flex items-center"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Products
          </Link>
          <span className="mx-2 text-gray-400">/</span>

          <span className="text-rose-600 font-medium">{product.name}</span>
        </nav>

        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Product Image - Single image only */}
            <div className="p-6">
              <div className="relative h-80 md:h-96 w-full rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={
                    product.imageUrl ||
                    "https://placehold.co/600x600/rose/white?text=No+Image"
                  }
                  alt={product.name}
                  fill
                  className="object-cover rounded-lg hover:scale-105 transition-transform duration-300"
                  priority
                />
                {product.featured && (
                  <div className="absolute top-4 left-4 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Featured
                  </div>
                )}
                {!product.inStock && (
                  <div className="absolute top-4 right-4 bg-gray-700 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Out of Stock
                  </div>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="p-8 flex flex-col">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>

              <div className="text-2xl md:text-3xl font-bold text-rose-600 mb-6">
                {formatPrice(product.price)}
              </div>

              <div className="prose prose-sm mb-8 text-gray-600 flex-grow">
                <p className="leading-relaxed">
                  {product.description ||
                    "No description available for this product."}
                </p>
              </div>

              {/* Product Benefits */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center">
                  <div className="mr-3 bg-rose-100 p-2 rounded-full">
                    <Truck className="h-5 w-5 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Free Shipping</p>
                    <p className="text-xs text-gray-500">
                      On orders over EGP 500
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="mr-3 bg-rose-100 p-2 rounded-full">
                    <Package2 className="h-5 w-5 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Secure Packaging</p>
                    <p className="text-xs text-gray-500">
                      Safe delivery guaranteed
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="mr-3 bg-rose-100 p-2 rounded-full">
                    <RefreshCw className="h-5 w-5 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">30-Day Returns</p>
                    <p className="text-xs text-gray-500">Easy return process</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="mr-3 bg-rose-100 p-2 rounded-full">
                    <Heart className="h-5 w-5 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Cruelty Free</p>
                    <p className="text-xs text-gray-500">
                      Not tested on animals
                    </p>
                  </div>
                </div>
              </div>

              {/* Add to cart section */}
              <div className="mt-4 space-y-4">
                <Suspense
                  fallback={
                    <Button disabled className="w-full">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading
                    </Button>
                  }
                >
                  <ProductAddToCartClient product={product} />
                </Suspense>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              You might also like
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct: any) => (
                <Link
                  href={`/product/${relatedProduct.id}`}
                  key={relatedProduct.id}
                >
                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={
                          relatedProduct.imageUrl ||
                          "https://placehold.co/400x400/rose/white?text=No+Image"
                        }
                        alt={relatedProduct.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-800 mb-1 truncate">
                        {relatedProduct.name}
                      </h3>
                      <p className="text-rose-600 font-bold">
                        {formatPrice(relatedProduct.price)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
