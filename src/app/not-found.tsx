"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20 text-center">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden -z-10 opacity-10">
        <div className="absolute -top-[25%] -right-[25%] w-[50%] h-[50%] rounded-full bg-rose-300 blur-[100px]"></div>
        <div className="absolute -bottom-[25%] -left-[25%] w-[50%] h-[50%] rounded-full bg-rose-600 blur-[100px]"></div>
      </div>

      {/* Error code with improved gradient */}
      <div className="relative">
        <h1 className="text-[180px] md:text-[250px] font-extrabold tracking-tighter leading-none bg-gradient-to-r from-rose-500 via-rose-400 to-rose-600 text-transparent bg-clip-text drop-shadow-sm">
          404
        </h1>

        <div className="mt-[-20px] md:mt-[-30px] mb-4">
          <span className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
            Page Not Found
          </span>
        </div>
      </div>

      {/* Message */}
      <div className="mb-12 max-w-md text-gray-500">
        <p className="text-lg">
          Sorry, we couldn&apos;t find the page you were looking for. It might
          have been moved or deleted.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          asChild
          className="bg-rose-500 hover:bg-rose-600 text-white border-none"
        >
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Link>
        </Button>
        <Button
          variant="outline"
          className="border-rose-200 text-rose-600 hover:bg-rose-50"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>

      {/* Suggested links */}
      <div className="mt-10">
        <h3 className="text-sm uppercase text-gray-500 mb-4 font-medium">
          Or check these pages
        </h3>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/products"
            className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-rose-100 hover:text-rose-700 transition-colors text-sm"
          >
            Products
          </Link>
          <Link
            href="/artists"
            className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-rose-100 hover:text-rose-700 transition-colors text-sm"
          >
            Artists
          </Link>
          <Link
            href="/contact"
            className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-rose-100 hover:text-rose-700 transition-colors text-sm"
          >
            Contact Us
          </Link>
          <Link
            href="/about"
            className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-rose-100 hover:text-rose-700 transition-colors text-sm"
          >
            About
          </Link>
        </div>
      </div>
    </div>
  );
}
