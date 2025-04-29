import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import CheckoutSummary from "@/components/checkout/CheckoutSummary";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center mb-8 text-sm">
            <Link
              href="/cart"
              className="text-gray-600 hover:text-rose-500 flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Cart
            </Link>
          </nav>

          <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Shipping & Payment Information
                  </h2>
                </div>
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center p-12">
                      <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
                    </div>
                  }
                >
                  <CheckoutForm />
                </Suspense>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-xl shadow-md overflow-hidden sticky top-6">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Order Summary
                  </h2>
                </div>
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center p-12">
                      <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
                    </div>
                  }
                >
                  <CheckoutSummary />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
