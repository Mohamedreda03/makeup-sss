import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, Filter, Search } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Product, ProductsResponse } from "@/types/product";
import { formatPrice } from "@/lib/utils";

// Ensure server rendering with no caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Fetch products from the API with pagination and optional filters
async function getProducts(
  page: number = 1,
  limit: number = 9,
  category?: string
): Promise<{
  products: Product[];
  total: number;
  totalPages: number;
  currentPage: number;
  categories: string[];
}> {
  try {
    // Build the URL with query parameters
    const url = new URL(
      `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/api/products`
    );

    // Add parameters to URL
    url.searchParams.append("page", page.toString());
    url.searchParams.append("limit", limit.toString());
    if (category) {
      url.searchParams.append("category", category);
    }

    // Fetch data from API
    const res = await fetch(url.toString(), { cache: "no-store" });

    if (!res.ok) {
      throw new Error("Failed to fetch products");
    }

    const data: ProductsResponse = await res.json();

    return {
      products: data.products,
      total: data.total,
      totalPages: data.totalPages,
      currentPage: data.currentPage,
      categories: data.categories,
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      products: [],
      total: 0,
      totalPages: 0,
      currentPage: page,
      categories: [],
    };
  }
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: {
    page?: string;
    category?: string;
  };
}) {
  // Get pagination parameters from URL with safeguards
  const pageParam = searchParams?.page;
  const rawPage = pageParam ? parseInt(pageParam) : 1;
  // Ensure page is a valid number
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  const category = searchParams?.category || undefined;
  const pageSize = 9; // Number of products per page

  // Fetch products with pagination
  const { products, total, totalPages } = await getProducts(
    page,
    pageSize,
    category
  );

  // Generate page numbers to display (implement logic to show ellipsis)
  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];

    if (totalPages <= 1) {
      return pageNumbers; // No pagination needed
    }

    // Always show first page
    pageNumbers.push(1);

    // Add ellipsis if needed
    if (page > 3) {
      pageNumbers.push("dots-start");
    }

    // Show pages around current page
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      if (i === 1 || i === totalPages) continue; // Skip if it's first or last page (already added)
      pageNumbers.push(i);
    }

    // Add ellipsis if needed
    if (page < totalPages - 2) {
      pageNumbers.push("dots-end");
    }

    // Always show last page if more than 1 page
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  // Build pagination URL with current category if present
  const getPaginationUrl = (pageNum: number) => {
    // Use URLSearchParams to properly handle query parameters
    const params = new URLSearchParams();

    // Only add page parameter if it's not the default first page
    if (pageNum > 1) {
      params.set("page", pageNum.toString());
    }

    // Add category if present
    if (category) {
      params.set("category", category);
    }

    // Return the URL with query parameters if they exist
    const queryString = params.toString();
    return `/products${queryString ? `?${queryString}` : ""}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 dark:from-gray-950 dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative py-20">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-rose-400/20 to-pink-500/20 dark:from-rose-900/20 dark:to-pink-800/20 z-0 pointer-events-none"></div>
        <div className="absolute top-1/4 right-1/3 w-64 h-64 rounded-full bg-rose-400/10 dark:bg-rose-700/10 z-0 pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-pink-300/10 dark:bg-pink-800/10 z-0 pointer-events-none"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
              Beauty Products Collection
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8">
              Discover our premium range of makeup products, handpicked for
              professionals and beauty enthusiasts alike.
            </p>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="container mx-auto px-4 py-10 pb-16 relative z-10">
        {products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-rose-100">
            <Image
              src="/images/no-results.svg"
              alt="No products found"
              width={150}
              height={150}
              className="mx-auto mb-6"
            />
            <h3 className="text-xl font-medium text-gray-800 mb-2">
              No products found
            </h3>
            <p className="text-gray-500 mb-6">
              We couldn't find any products. Please check back later.
            </p>
            <Button
              className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white"
              asChild
            >
              <Link href="/products">View All Products</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-rose-100 overflow-hidden shadow-md hover:shadow-xl transition-all group"
              >
                <Link href={`/product/${product.id}`}>
                  <div className="relative h-64 overflow-hidden">
                    <Image
                      src={
                        product.imageUrl ||
                        "https://placehold.co/400x400/rose/white?text=No+Image"
                      }
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {product.featured && (
                      <div className="absolute top-4 left-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Featured
                      </div>
                    )}

                    {!product.inStock && (
                      <div className="absolute top-4 right-4 bg-gray-700 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Out of Stock
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-5">
                  <Link
                    href={`/product/${product.id}`}
                    className="block hover:text-rose-600 transition-colors"
                  >
                    <h3 className="font-bold text-lg text-gray-800 mb-1">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
                      {formatPrice(product.price)}
                    </span>
                    <Link href={`/product/${product.id}`}>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white"
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="flex justify-center items-center mt-12 gap-1">
            {/* Previous Button */}
            {page > 1 && (
              <Link href={getPaginationUrl(page - 1)}>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 border-rose-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous page</span>
                </Button>
              </Link>
            )}

            {/* Page Numbers */}
            {getPageNumbers().map((pageNum, index) => {
              if (pageNum === "dots-start" || pageNum === "dots-end") {
                return (
                  <span
                    key={`dots-${index}`}
                    className="px-3 py-2 text-gray-500"
                  >
                    ...
                  </span>
                );
              }

              return (
                <Link key={pageNum} href={getPaginationUrl(pageNum as number)}>
                  <Button
                    variant={page === pageNum ? "default" : "outline"}
                    className={`h-10 w-10 ${
                      page === pageNum
                        ? "bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white"
                        : "border-rose-200 text-gray-600 hover:bg-rose-50"
                    }`}
                  >
                    {pageNum}
                  </Button>
                </Link>
              );
            })}

            {/* Next Button */}
            {page < totalPages && (
              <Link href={getPaginationUrl(page + 1)}>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 border-rose-200"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next page</span>
                </Button>
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
