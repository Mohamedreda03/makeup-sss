"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";
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
  }

  // Calculate totals
  const subtotal = total;
  const shipping = 50; // Fixed shipping rate in EGP
  const tax = subtotal * 0.14; // 14% VAT in Egypt
  const grandTotal = subtotal + shipping + tax;

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
      </div>

      {/* Totals */}
      <div className="border-t border-gray-200 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Shipping</span>
          <span className="font-medium">{formatPrice(shipping)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax (14%)</span>
          <span className="font-medium">{formatPrice(tax)}</span>
        </div>

        <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200 mt-2">
          <span>Total</span>
          <span className="text-rose-600">{formatPrice(grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}
