"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2, Star, Gift } from "lucide-react";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import CheckoutSummary from "@/components/checkout/CheckoutSummary";
import { useCartStore } from "@/store/useCartStore";

// Components for discount notification
function DiscountNotificationBanner() {
  const { itemCount } = useCartStore();
  const hasDiscount = itemCount >= 3;

  if (!hasDiscount) return null;

  return (
    <div className="mb-8 mx-4 lg:mx-0">
      <div className="bg-gradient-to-r from-amber-50 to-orange-100 border border-amber-200 rounded-xl p-6 shadow-sm">
        <div className="text-center">
          <div className="flex items-center justify-center mb-3">
            <Gift className="h-6 w-6 text-amber-600 mr-2 animate-bounce" />
            <h3 className="text-lg font-bold text-amber-800">
              🎉 Bulk Discount Active!
            </h3>
          </div>
          <p className="text-sm text-amber-700 mb-3">
            You're getting <strong>10% off</strong> your entire order for having{" "}
            <strong>3 or more products</strong> in your cart!
          </p>
          <div className="flex items-center justify-center text-xs text-amber-600">
            <Star className="h-3 w-3 mr-1 fill-current" />
            <span>Discount already applied to your order total below</span>
          </div>
        </div>
      </div>
    </div>
  );
}

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
          </nav>{" "}
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>
          {/* Discount Notification Banner */}
          <DiscountNotificationBanner />
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
