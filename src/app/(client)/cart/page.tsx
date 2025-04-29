import { Suspense } from "react";
import Link from "next/link";
import { Loader2, ShoppingBag, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import CartClient from "@/components/cart/CartClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function CartPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center mb-8 text-sm">
            <Link
              href="/products"
              className="text-gray-600 hover:text-rose-500 flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Continue Shopping
            </Link>
          </nav>

          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <ShoppingBag className="h-6 w-6 mr-2 text-rose-500" />
                Your Shopping Cart
              </h1>
            </div>

            <Suspense
              fallback={
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
                </div>
              }
            >
              <CartClient />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
