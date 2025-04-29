"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Loader2,
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";

export default function CartClient() {
  const { items, itemCount, total, removeItem, updateQuantity, clearCart } =
    useCartStore();
  const [isMounted, setIsMounted] = useState(false);

  // Fix hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-gray-100 p-3 inline-block">
            <ShoppingBag className="h-8 w-8 text-gray-500" />
          </div>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Your cart is empty
        </h3>
        <p className="text-gray-500 mb-6">
          Browse our products and find something you like!
        </p>
        <Link href="/products">
          <Button className="bg-rose-500 hover:bg-rose-600">
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  // Calculate additional costs
  const shipping = 50; // Fixed shipping rate in EGP
  const tax = total * 0.14; // 14% VAT
  const grandTotal = total + shipping + tax;

  return (
    <div className="flex flex-col lg:flex-row">
      {/* Cart items list */}
      <div className="lg:w-2/3 divide-y divide-gray-200">
        {items.map((item) => (
          <div
            key={item.product.id}
            className="py-6 px-6 flex flex-col sm:flex-row items-center sm:items-start gap-4"
          >
            {/* Product Image */}
            <div className="w-24 h-24 relative flex-shrink-0">
              <Link href={`/product/${item.product.id}`}>
                <Image
                  src={
                    item.product.imageUrl ||
                    "https://placehold.co/200x200/rose/white?text=No+Image"
                  }
                  alt={item.product.name}
                  fill
                  className="object-cover rounded-md"
                />
              </Link>
            </div>

            {/* Product Details */}
            <div className="flex-grow text-center sm:text-left">
              <Link
                href={`/product/${item.product.id}`}
                className="font-medium text-gray-900 hover:text-rose-500"
              >
                {item.product.name}
              </Link>
              <p className="text-sm text-gray-500 mt-1">
                {item.product.category}
              </p>
              <div className="mt-1 text-lg font-semibold text-rose-600">
                {formatPrice(item.product.price)}
              </div>

              <div className="mt-3 flex items-center justify-center sm:justify-start gap-4">
                {/* Quantity controls */}
                <div className="flex items-center border rounded-md overflow-hidden border-gray-200">
                  <button
                    type="button"
                    className="p-1 text-gray-600 hover:bg-gray-100"
                    onClick={() =>
                      updateQuantity(item.product.id, item.quantity - 1)
                    }
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-2 py-1 w-10 text-center text-sm">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    className="p-1 text-gray-600 hover:bg-gray-100"
                    onClick={() =>
                      updateQuantity(item.product.id, item.quantity + 1)
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Item subtotal */}
                <span className="text-sm text-gray-500">
                  Subtotal:{" "}
                  <span className="font-semibold text-gray-700">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                </span>
              </div>
            </div>

            {/* Remove Button */}
            <div>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-rose-500 transition-colors"
                onClick={() => removeItem(item.product.id)}
                aria-label="Remove item"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Summary */}
      <div className="lg:w-1/3 p-6 bg-gray-50 border-t lg:border-t-0 lg:border-l border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              Subtotal ({itemCount} item{itemCount !== 1 ? "s" : ""})
            </span>
            <span className="font-medium">{formatPrice(total)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium">{formatPrice(shipping)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax (14%)</span>
            <span className="font-medium">{formatPrice(tax)}</span>
          </div>

          <div className="border-t border-gray-200 pt-3 mt-3">
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span className="text-rose-600">{formatPrice(grandTotal)}</span>
            </div>
          </div>
        </div>

        <Link href="/checkout">
          <Button className="w-full bg-rose-500 hover:bg-rose-600 text-white mb-4">
            Proceed to Checkout
          </Button>
        </Link>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => clearCart()}
        >
          Clear Cart
        </Button>

        {/* Trust badges */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex flex-col gap-3">
            <div className="flex items-center text-sm text-gray-600">
              <ShieldCheck className="h-4 w-4 mr-2 text-green-500" />
              <span>Secure checkout</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <CreditCard className="h-4 w-4 mr-2 text-green-500" />
              <span>Multiple payment options</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
