"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

interface ProductSearchProps {
  initialValue?: string;
}

export function ProductSearch({ initialValue = "" }: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearch = (query: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (query.trim()) {
        params.set("search", query.trim());
        // Reset to first page when searching
        params.delete("page");
      } else {
        params.delete("search");
      }

      router.push(`/products?${params.toString()}`);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const handleClear = () => {
    setSearchQuery("");
    handleSearch("");
  };
  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-0 mb-6 sm:mb-8">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name..."
            className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 text-sm sm:text-base border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent shadow-sm bg-white"
            disabled={isPending}
          />
          {searchQuery && !isPending && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              disabled={isPending}
              aria-label="Clear search"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          )}
        </div>

        {isPending && (
          <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-t-2 border-b-2 border-rose-500"></div>
          </div>
        )}
      </form>

      {/* Search suggestions */}
      <div className="mt-3 text-center">
        <p className="text-xs sm:text-sm text-gray-500 px-2">
          Search through our collection of premium beauty products
        </p>
      </div>
    </div>
  );
}
