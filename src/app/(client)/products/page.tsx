import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Sparkles, Star } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { db } from "@/lib/db";
import { ProductSearch } from "./components";

// Ensure server rendering with no caching
export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: {
    page?: string;
    search?: string;
  };
}) {
  // Get pagination and search parameters from URL with safeguards
  const pageParam = searchParams?.page;
  const searchQuery = searchParams?.search;
  const rawPage = pageParam ? parseInt(pageParam) : 1;
  // Ensure page is a valid number
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const pageSize = 9; // Number of products per page
  const skip = (page - 1) * pageSize;
  try {
    // Build where condition for search
    const whereCondition = searchQuery
      ? {
          name: {
            contains: searchQuery,
            mode: "insensitive" as const,
          },
        }
      : {};

    // Fetch products directly from database with pagination and search
    const products = await db.product.findMany({
      where: whereCondition,
      skip,
      take: pageSize,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get total count for pagination with search filter
    const total = await db.product.count({
      where: whereCondition,
    });

    // Calculate total pages
    const totalPages = Math.ceil(total / pageSize);

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
    }; // Build pagination URL
    const getPaginationUrl = (pageNum: number) => {
      // Use URLSearchParams to properly handle query parameters
      const params = new URLSearchParams();

      // Add search parameter if it exists
      if (searchQuery) {
        params.set("search", searchQuery);
      }

      // Only add page parameter if it's not the default first page
      if (pageNum > 1) {
        params.set("page", pageNum.toString());
      }

      // Return the URL with query parameters if they exist
      const queryString = params.toString();
      return `/products${queryString ? `?${queryString}` : ""}`;
    };
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-pink-50/50">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-rose-100/40 via-pink-50/30 to-purple-100/20"></div>
          <div className="absolute top-10 right-10 w-32 h-32 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-rose-300/20 to-pink-400/20 blur-xl animate-pulse"></div>
          <div className="absolute bottom-10 left-10 w-40 h-40 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-purple-300/15 to-rose-400/15 blur-2xl animate-pulse delay-1000"></div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-rose-200/50 text-rose-600 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4 mr-2" />
                Premium Beauty Collection
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                Beauty Products
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                Discover our curated collection of premium makeup products,
                designed for professionals and beauty enthusiasts who demand
                excellence.
              </p>

              {/* Search Component */}
              <div className="max-w-lg mx-auto">
                <ProductSearch initialValue={searchQuery} />
              </div>
            </div>
          </div>
        </section>{" "}
        {/* Search Results Info */}
        {searchQuery && (
          <section className="py-6">
            <div className="container mx-auto px-4">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 max-w-2xl mx-auto">
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {products.length > 0
                        ? `Found ${total} product${
                            total !== 1 ? "s" : ""
                          } for "${searchQuery}"`
                        : `No products found for "${searchQuery}"`}
                    </h3>
                    {total > pageSize && products.length > 0 && (
                      <p className="text-sm text-gray-600">
                        Showing {(page - 1) * pageSize + 1} -{" "}
                        {Math.min(page * pageSize, total)} of {total} results
                      </p>
                    )}
                    {products.length === 0 && (
                      <p className="text-gray-600 mt-2">
                        Try searching with different keywords or browse all
                        products.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}{" "}
        {/* Products Grid */}
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4">
            {products.length === 0 ? (
              <div className="text-center py-20">
                <div className="max-w-md mx-auto">
                  <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-16 h-16 text-rose-400" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                    {searchQuery
                      ? `No products found for "${searchQuery}"`
                      : "No products available"}
                  </h3>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    {searchQuery
                      ? "Try searching with different keywords or browse all products."
                      : "We couldn't find any products. Please check back later."}
                  </p>
                  {searchQuery ? (
                    <Button
                      className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-8 py-3 rounded-full text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                      asChild
                    >
                      <Link href="/products">View All Products</Link>
                    </Button>
                  ) : (
                    <Button
                      className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-8 py-3 rounded-full text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                      asChild
                    >
                      <Link href="/products">Refresh Page</Link>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="group relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-white/50 hover:border-rose-200/50 hover:scale-[1.02]"
                  >
                    {/* Product Image */}
                    <Link href={`/product/${product.id}`}>
                      <div className="relative h-64 md:h-72 overflow-hidden rounded-t-3xl">
                        <Image
                          src={
                            product.image ||
                            "https://placehold.co/400x400/f8fafc/94a3b8?text=No+Image"
                          }
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                        {/* Product Badges */}
                        {product.featured && (
                          <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
                            <Star className="w-3 h-3 inline mr-1" />
                            Featured
                          </div>
                        )}

                        {product.stock_quantity <= 0 && (
                          <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
                            Out of Stock
                          </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-rose-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      </div>
                    </Link>

                    {/* Product Content */}
                    <div className="p-6 md:p-8">
                      <Link
                        href={`/product/${product.id}`}
                        className="block group/title"
                      >
                        <h3 className="font-bold text-xl md:text-2xl text-gray-800 mb-3 line-clamp-2 group-hover/title:text-rose-600 transition-colors duration-300">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-gray-600 text-sm md:text-base mb-6 line-clamp-3 leading-relaxed">
                        {product.description}
                      </p>

                      {/* Price and Action */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-2xl md:text-3xl bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                        <Link href={`/product/${product.id}`}>
                          <Button className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-6 py-3 rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 group/btn">
                            <ShoppingCart className="h-4 w-4 mr-2 group-hover/btn:animate-bounce" />
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Decorative Border Gradient */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-rose-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                  </div>
                ))}
              </div>
            )}{" "}
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-16 gap-2">
                {/* Previous Button */}
                {page > 1 && (
                  <Link href={getPaginationUrl(page - 1)}>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-2xl border-rose-200/50 bg-white/70 backdrop-blur-sm hover:bg-rose-50 hover:border-rose-300 transition-all duration-300"
                    >
                      <ChevronLeft className="h-5 w-5" />
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
                        className="px-4 py-2 text-gray-500 font-medium"
                      >
                        ...
                      </span>
                    );
                  }

                  return (
                    <Link
                      key={pageNum}
                      href={getPaginationUrl(pageNum as number)}
                    >
                      <Button
                        variant={page === pageNum ? "default" : "outline"}
                        className={`h-12 w-12 rounded-2xl font-medium transition-all duration-300 ${
                          page === pageNum
                            ? "bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg"
                            : "border-rose-200/50 bg-white/70 backdrop-blur-sm text-gray-700 hover:bg-rose-50 hover:border-rose-300"
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
                      className="h-12 w-12 rounded-2xl border-rose-200/50 bg-white/70 backdrop-blur-sm hover:bg-rose-50 hover:border-rose-300 transition-all duration-300"
                    >
                      <ChevronRight className="h-5 w-5" />
                      <span className="sr-only">Next page</span>
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    );
  } catch (error) {
    console.error("Error fetching products:", error);

    // Error fallback
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-pink-50/50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm p-10 rounded-3xl shadow-xl max-w-md mx-auto text-center border border-white/50">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center">
            <ShoppingCart className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            We couldn't load the products. Please try again later.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-8 py-3 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }
}
