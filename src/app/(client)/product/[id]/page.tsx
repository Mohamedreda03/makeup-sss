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
  Check,
  ShieldCheck,
  ChevronRight,
  ZoomIn,
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
        stock_quantity: { gt: 0 },
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
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-12">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center mb-8 text-sm">
          <Link
            href="/products"
            className="text-rose-500 hover:text-rose-600 flex items-center font-medium"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Products
          </Link>
          <span className="mx-2 text-gray-400">/</span>

          <span className="text-gray-800 font-medium">{product.name}</span>
        </nav>

        <div className="bg-white rounded-xl overflow-hidden shadow-md mb-16 border border-rose-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Enhanced Product Image */}
            <div className="relative p-8 md:p-12 bg-gradient-to-br from-rose-100 via-pink-50 to-rose-50 flex items-center justify-center">
              {/* Decorative elements with pointer-events-none */}
              <div className="absolute top-8 left-8 w-32 h-32 rounded-full bg-pink-200/20 z-0 pointer-events-none"></div>
              <div className="absolute bottom-8 right-8 w-48 h-48 rounded-full bg-rose-200/20 z-0 pointer-events-none"></div>

              {/* Image container with improved styling */}
              <div className="relative w-full aspect-square max-w-md mx-auto z-10 group">
                <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-2xl -m-4 transition-all duration-300 opacity-0 group-hover:opacity-100"></div>

                <Image
                  src={
                    product.image ||
                    "https://placehold.co/800x800/rose/white?text=No+Image"
                  }
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain p-4 transition-all duration-500 group-hover:scale-110 z-20"
                  priority
                  quality={90}
                />

                {/* Zoom icon that appears on hover */}
                <div className="absolute bottom-4 right-4 bg-white/80 p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-30">
                  <ZoomIn className="h-5 w-5 text-rose-500" />
                </div>

                {product.featured && (
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm z-30">
                    Featured
                  </div>
                )}

                {product.stock_quantity <= 0 && (
                  <div className="absolute top-2 right-2 bg-gray-700/90 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm z-30">
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

              <div className="flex items-center mb-6">
                <div className="text-2xl md:text-3xl font-bold text-rose-600">
                  {formatPrice(product.price)}
                </div>
                {product.stock_quantity > 0 && product.inStock ? (
                  <span className="ml-4 inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    <Check className="h-3 w-3 mr-1" />
                    {product.stock_quantity} In Stock
                  </span>
                ) : (
                  <span className="ml-4 inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                    Out of Stock
                  </span>
                )}
              </div>

              <div className="prose prose-sm mb-8 text-gray-600 flex-grow">
                <p className="leading-relaxed">
                  {product.description ||
                    "No description available for this product."}
                </p>
              </div>

              {/* Product Features */}
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-4 rounded-lg mb-8">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Product Features
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-gray-700">
                    <ShieldCheck className="h-4 w-4 text-rose-500 mr-2" />
                    <span>High-quality ingredients</span>
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <ShieldCheck className="h-4 w-4 text-rose-500 mr-2" />
                    <span>Dermatologically tested</span>
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <ShieldCheck className="h-4 w-4 text-rose-500 mr-2" />
                    <span>100% cruelty-free</span>
                  </li>
                </ul>
              </div>

              {/* Shipping and Benefits */}
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
                    <Button disabled className="w-full bg-gray-300">
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
          <div className="mt-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 bg-clip-text text-transparent mb-4">
                You might also like
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Discover more beautiful products from our curated collection
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-rose-400 to-pink-600 mx-auto mt-4 rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct: any) => (
                <Link
                  href={`/product/${relatedProduct.id}`}
                  key={relatedProduct.id}
                  className="group"
                >
                  <div className="bg-white rounded-2xl border border-rose-100/50 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group-hover:-translate-y-2 backdrop-blur-sm">
                    {/* Image Container with Enhanced Effects */}
                    <div className="relative h-56 overflow-hidden bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100">
                      {/* Decorative Background Elements */}
                      <div className="absolute top-4 right-4 w-16 h-16 bg-pink-200/30 rounded-full blur-xl"></div>
                      <div className="absolute bottom-4 left-4 w-20 h-20 bg-rose-200/20 rounded-full blur-xl"></div>

                      <Image
                        src={
                          relatedProduct.image ||
                          "https://placehold.co/400x400/rose/white?text=No+Image"
                        }
                        alt={relatedProduct.name}
                        fill
                        className="object-contain p-4 group-hover:scale-110 transition-all duration-700 ease-out"
                      />

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                      {/* Stock Badge */}
                      {relatedProduct.stock_quantity > 0 ? (
                        <div className="absolute top-3 left-3 bg-green-500/90 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg">
                          In Stock
                        </div>
                      ) : (
                        <div className="absolute top-3 left-3 bg-red-500/90 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg">
                          Out of Stock
                        </div>
                      )}

                      {/* Featured Badge */}
                      {relatedProduct.featured && (
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                          ⭐ Featured
                        </div>
                      )}

                      {/* Quick View Button */}
                      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        <div className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors">
                          <ZoomIn className="h-4 w-4 text-rose-500" />
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-5">
                      <div className="mb-3">
                        <h3 className="font-semibold text-gray-900 mb-1 truncate text-lg group-hover:text-rose-600 transition-colors duration-300">
                          {relatedProduct.name}
                        </h3>
                        <p className="text-gray-500 text-sm truncate">
                          {relatedProduct.category}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-2xl font-bold text-rose-600 group-hover:text-rose-700 transition-colors">
                            {formatPrice(relatedProduct.price)}
                          </span>
                          {relatedProduct.stock_quantity > 0 && (
                            <span className="text-xs text-green-600 font-medium">
                              {relatedProduct.stock_quantity} available
                            </span>
                          )}
                        </div>

                        {/* Add to Cart Icon */}
                        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                          <div className="bg-gradient-to-r from-rose-500 to-pink-600 p-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
                            <ChevronRight className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Gradient Border */}
                    <div className="h-1 bg-gradient-to-r from-rose-400 via-pink-500 to-rose-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="flex justify-center mt-12">
              <Button
                variant="outline"
                className="border-2 border-rose-300 text-rose-600 hover:bg-gradient-to-r hover:from-rose-500 hover:to-pink-600 hover:text-white hover:border-transparent transition-all duration-300 px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                asChild
              >
                <Link href="/products" className="flex items-center gap-3">
                  <span>View All Products</span>
                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
