"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Star, Gift } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";

export default function CheckoutSummary() {
  const { items, itemCount, total } = useCartStore();
  const [mounted, setMounted] = useState(false);

  // Handle hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  } // Calculate totals
  const subtotal = total;
  const shipping = 50; // Fixed shipping rate in EGP

  // Calculate bulk discount (10% off for 3+ items)
  const hasDiscount = itemCount >= 3;
  const discountAmount = hasDiscount ? subtotal * 0.1 : 0;
  const discountedSubtotal = subtotal - discountAmount;

  const tax = discountedSubtotal * 0.14; // 14% VAT in Egypt (applied after discount)
  const grandTotal = discountedSubtotal + shipping + tax;

  if (items.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 mb-4">Your cart is empty</p>
        <Link
          href="/products"
          className="text-rose-500 font-medium hover:text-rose-600"
        >
          Continue shopping
        </Link>
      </div>
    );
  }
  return (
    <div className="p-6">
      {" "}
      {/* Bulk Discount Banner */}
      {hasDiscount && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg shadow-sm">
          <div className="flex items-center">
            <Gift className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <h3 className="text-sm font-semibold text-green-800">
                🎉 Bulk Discount Applied!
              </h3>
              <p className="text-xs text-green-700 mt-1">
                <strong>10% discount</strong> automatically applied for ordering
                3+ products.
                <br />
                <span className="font-medium">
                  You're saving {formatPrice(discountAmount)} on this order!
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Order Items */}
      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <div key={item.product.id} className="flex items-center gap-4">
            {/* Product Image */}
            <div className="w-16 h-16 relative flex-shrink-0">
              <Image
                src={
                  item.product.imageUrl ||
                  "https://placehold.co/200x200/rose/white?text=No+Image"
                }
                alt={item.product.name}
                fill
                className="object-cover rounded-md"
              />
            </div>

            {/* Product Details */}
            <div className="flex-grow">
              <h4 className="font-medium text-gray-900 text-sm">
                {item.product.name}
              </h4>
              <div className="text-sm text-gray-500 mt-1">
                Qty: {item.quantity}
              </div>
            </div>

            {/* Price */}
            <div className="font-medium text-gray-900">
              {formatPrice(item.product.price * item.quantity)}
            </div>
          </div>
        ))}
      </div>{" "}
      {/* Totals */}
      <div className="border-t border-gray-200 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal ({itemCount} items)</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>

        {hasDiscount && (
          <div className="flex justify-between text-sm bg-green-50 px-2 py-1 rounded">
            <span className="text-green-700 flex items-center font-medium">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Bulk Discount (10% off)
            </span>
            <span className="font-semibold text-green-700">
              -{formatPrice(discountAmount)}
            </span>
          </div>
        )}

        {hasDiscount && (
          <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
            <span className="text-gray-600">Subtotal after discount</span>
            <span className="font-medium">
              {formatPrice(discountedSubtotal)}
            </span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Shipping</span>
          <span className="font-medium">{formatPrice(shipping)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax (14% VAT)</span>
          <span className="font-medium">{formatPrice(tax)}</span>
        </div>

        <div className="flex justify-between font-bold text-lg pt-3 border-t-2 border-gray-300 mt-3">
          <span>Total Amount</span>
          <span className="text-rose-600">{formatPrice(grandTotal)}</span>
        </div>

        {hasDiscount && (
          <div className="text-center">
            <p className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
              💡 You saved {formatPrice(discountAmount)} with bulk discount!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
