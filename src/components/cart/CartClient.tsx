"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";

function CartClient() {
  const { items, itemCount, total, removeItem, updateQuantity, clearCart } =
    useCartStore();

  if (items.length === 0) {
    return (
      <div className="text-center py-16 px-6">
        <ShoppingCart className="h-24 w-24 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Your cart is empty
        </h2>
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
  const shipping = 50;

  // Calculate bulk discount (10% off for 3+ items)
  const hasDiscount = itemCount >= 3;
  const discountAmount = hasDiscount ? total * 0.1 : 0;
  const discountedSubtotal = total - discountAmount;

  const tax = discountedSubtotal * 0.14; // 14% VAT applied after discount
  const grandTotal = discountedSubtotal + shipping + tax;

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="lg:w-2/3">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 border border-gray-200 rounded-lg"
              >
                {/* Product Image */}
                <div className="w-24 h-24 flex-shrink-0">
                  <Image
                    src={item.product.imageUrl || "/images/placeholder.png"}
                    alt={item.product.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>

                {/* Product Details */}
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="font-semibold text-gray-900">
                    {item.product.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {item.product.category}
                  </p>
                  <p className="text-lg font-semibold text-rose-600 mt-1">
                    {formatPrice(item.product.price)}
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                  {" "}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Remove Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Clear Cart Button */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={clearCart}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Clear Cart
            </Button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:w-1/3">
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Order Summary
            </h2>{" "}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal ({itemCount} items)</span>
                <span>{formatPrice(total)}</span>
              </div>

              {hasDiscount && (
                <div className="flex justify-between bg-green-50 px-2 py-1 rounded">
                  <span className="text-green-700 font-medium">
                    Bulk Discount (10% off)
                  </span>
                  <span className="text-green-700 font-semibold">
                    -{formatPrice(discountAmount)}
                  </span>
                </div>
              )}

              {hasDiscount && (
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <span>Subtotal after discount</span>
                  <span>{formatPrice(discountedSubtotal)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (14% VAT)</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-rose-600">
                    {formatPrice(grandTotal)}
                  </span>
                </div>
              </div>
            </div>
            <Link href="/checkout" className="mt-6 block">
              <Button className="w-full bg-rose-500 hover:bg-rose-600">
                Proceed to Checkout
              </Button>
            </Link>
          </div>{" "}
        </div>
      </div>
    </div>
  );
}

export default CartClient;
