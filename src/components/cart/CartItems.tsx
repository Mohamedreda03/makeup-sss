"use client";

import { useCartStore } from "@/store/useCartStore";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Loader2, Trash2, MinusCircle, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export default function CartItems() {
  const { items, itemCount, total, removeItem, updateQuantity } =
    useCartStore();
  const [mounted, setMounted] = useState(false);
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setLoadingItems((prev) => ({ ...prev, [itemId]: true }));
    try {
      updateQuantity(itemId, newQuantity);
    } finally {
      setLoadingItems((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setLoadingItems((prev) => ({ ...prev, [itemId]: true }));
    try {
      removeItem(itemId);
    } finally {
      setLoadingItems((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  if (!mounted) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading cart...</span>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Your cart is empty
        </h3>
        <p className="text-gray-500">
          Start shopping to add items to your cart.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cart Items */}
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start space-x-4 bg-white p-4 rounded-lg border"
          >
            {/* Product Image */}
            <div className="flex-shrink-0">
              <div className="w-16 h-16 relative rounded-md overflow-hidden bg-gray-100">
                {item.product.imageUrl ? (
                  <Image
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg
                      className="h-8 w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Product Details */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {item.product.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {item.product.category}
              </p>
              <p className="text-sm font-medium text-gray-900 mt-2">
                {formatPrice(item.product.price)}
              </p>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1 || loadingItems[item.id]}
                className="h-8 w-8 p-0"
              >
                {loadingItems[item.id] ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <MinusCircle className="h-3 w-3" />
                )}
              </Button>

              <span className="font-medium min-w-[2rem] text-center">
                {item.quantity}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                disabled={loadingItems[item.id]}
                className="h-8 w-8 p-0"
              >
                {loadingItems[item.id] ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <PlusCircle className="h-3 w-3" />
                )}
              </Button>
            </div>

            {/* Item Total */}
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {formatPrice(item.product.price * item.quantity)}
              </p>
            </div>

            {/* Remove Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveItem(item.id)}
              disabled={loadingItems[item.id]}
              className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
            >
              {loadingItems[item.id] ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </Button>
          </div>
        ))}
      </div>

      {/* Cart Summary */}
      <div className="border-t pt-4 mt-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">
              {itemCount} {itemCount === 1 ? "item" : "items"} in cart
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-gray-900">
              Total: {formatPrice(total)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
