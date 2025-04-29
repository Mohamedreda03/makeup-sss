import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Product, ProductsResponse } from "@/types/product";
import { formatPrice } from "@/lib/utils";

// Disable caching to ensure fresh data on each request
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Fetch products from the API with pagination and optional filters
async function getProducts(
  page: number = 1,
  limit: number = 6,
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
  const pageSize = 6; // Number of products per page

  // Fetch products with pagination
  const { products, total, totalPages, categories } = await getProducts(
    page,
    pageSize,
    category
  );

  // Log debugging information
  console.log(
    `Page rendering: page=${page}, total=${total}, totalPages=${totalPages}, products=${products.length}`
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-rose-500 to-rose-600 text-white py-16 md:py-24">
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute w-[500px] h-[500px] -top-[250px] -right-[100px] rounded-full bg-rose-300 blur-[100px]"></div>
          <div className="absolute w-[500px] h-[500px] -bottom-[250px] -left-[100px] rounded-full bg-rose-700 blur-[100px]"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Our Beauty Products
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8">
              Discover our range of high-quality makeup and beauty products,
              carefully selected for professional results.
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </section>

      {/* Products Grid */}
      <section className="container mx-auto px-4 py-4 mb-16 mt-11">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-gray-700">
              No products found
            </h3>
            <p className="text-gray-500 mt-2">
              Try changing your filters or check back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-md hover:shadow-lg transition-all group"
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

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent h-1/3"></div>
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
                    <span className="font-bold text-lg">
                      {formatPrice(product.price)}
                    </span>
                    <Link href={`/product/${product.id}`}>
                      <Button
                        size="sm"
                        className="bg-rose-500 hover:bg-rose-600 text-white"
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        View Product
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
          <div className="flex justify-center items-center mt-8 gap-1 overflow-x-auto max-w-full px-2 whitespace-nowrap">
            {/* Previous Button */}
            <Link
              href={getPaginationUrl(page > 1 ? page - 1 : 1)}
              className={`px-4 py-2 rounded border text-sm font-medium transition-colors flex items-center ${
                page === 1
                  ? "bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed pointer-events-none"
                  : "bg-white text-rose-500 border-rose-200 hover:bg-rose-50"
              }`}
              aria-disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Link>

            {/* Page Numbers */}
            {getPageNumbers().map((pageNum, index) => {
              if (typeof pageNum === "string") {
                return (
                  <span key={pageNum} className="px-2 text-gray-400">
                    ...
                  </span>
                );
              }
              return (
                <Link
                  key={pageNum}
                  href={getPaginationUrl(pageNum as number)}
                  className={`px-4 py-2 rounded border text-sm font-medium transition-colors ${
                    page === Number(pageNum)
                      ? "bg-rose-500 text-white border-rose-500"
                      : "bg-white text-rose-500 border-rose-200 hover:bg-rose-50"
                  }`}
                >
                  {pageNum}
                </Link>
              );
            })}

            {/* Next Button */}
            <Link
              href={getPaginationUrl(page < totalPages ? page + 1 : totalPages)}
              className={`px-4 py-2 rounded border text-sm font-medium transition-colors flex items-center ${
                page === totalPages
                  ? "bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed pointer-events-none"
                  : "bg-white text-rose-500 border-rose-200 hover:bg-rose-50"
              }`}
              aria-disabled={page === totalPages}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-gray-100 to-gray-200 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">
              Join Our Beauty Community
            </h2>
            <p className="text-gray-600 mb-8">
              Subscribe to our newsletter for exclusive product launches, beauty
              tips, and special offers.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-grow px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              <Button className="bg-rose-500 hover:bg-rose-600 text-white">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
