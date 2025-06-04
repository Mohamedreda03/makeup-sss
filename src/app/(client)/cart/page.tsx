"use client";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag,
  ChevronLeft,
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  Star,
  Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";

export default function CartPage() {
  const { items, itemCount, total, removeItem, updateQuantity, clearCart } =
    useCartStore();
  const shipping = 50;

  // Calculate bulk discount (10% off for 3+ items)
  const hasDiscount = itemCount >= 3;
  const discountAmount = hasDiscount ? total * 0.1 : 0;
  const discountedSubtotal = total - discountAmount;

  const tax = discountedSubtotal * 0.14; // 14% VAT applied after discount
  const grandTotal = discountedSubtotal + shipping + tax;

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
              </h1>{" "}
            </div>

            {/* Discount Notification Banner */}
            {hasDiscount && (
              <div className="mb-6 mx-4 lg:mx-0">
                <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Gift className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <h3 className="text-sm font-semibold text-green-800">
                        🎉 Bulk Discount Applied!
                      </h3>
                      <p className="text-xs text-green-700 mt-1">
                        You're saving {formatPrice(discountAmount)} with our 10%
                        bulk discount for 3+ products!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cart Content */}
            {items.length === 0 ? (
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
            ) : (
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
                              src={
                                item.product.imageUrl ||
                                "/images/placeholder.png"
                              }
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
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
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
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
                            <span className="text-green-700 flex items-center font-medium">
                              <Star className="h-3 w-3 mr-1 fill-current" />
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

                        {hasDiscount && (
                          <div className="text-center">
                            <p className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                              💡 You saved {formatPrice(discountAmount)} with
                              bulk discount!
                            </p>
                          </div>
                        )}
                      </div>
                      <Link href="/checkout" className="mt-6 block">
                        <Button className="w-full bg-rose-500 hover:bg-rose-600">
                          Proceed to Checkout
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
