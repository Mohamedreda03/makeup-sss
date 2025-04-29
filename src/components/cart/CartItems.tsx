"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Trash2, MinusCircle, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string | null;
    category: string;
  };
}

interface CartData {
  id: string;
  items: CartItem[];
  itemCount: number;
  total: number;
}

export default function CartItems() {
  const { toast } = useToast();
  const [cartData, setCartData] = useState<CartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});

  // Fetch cart data
  const fetchCart = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/cart");

      if (!response.ok) {
        throw new Error("Failed to fetch cart");
      }

      const data = await response.json();
      setCartData(data);
    } catch (error) {
      console.error("Error fetching cart:", error);
      toast({
        title: "Error",
        description: "Failed to load your shopping cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Remove item from cart
  const removeItem = async (itemId: string) => {
    try {
      setLoadingItems((prev) => ({ ...prev, [itemId]: true }));

      const response = await fetch(`/api/cart?itemId=${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove item");
      }

      // Update local state to remove item
      if (cartData) {
        setCartData({
          ...cartData,
          items: cartData.items.filter((item) => item.id !== itemId),
          itemCount:
            cartData.itemCount -
            (cartData.items.find((item) => item.id === itemId)?.quantity || 0),
          total:
            cartData.total -
            (cartData.items.find((item) => item.id === itemId)?.product.price ||
              0) *
              (cartData.items.find((item) => item.id === itemId)?.quantity ||
                0),
        });
      }

      // Dispatch custom event to notify navbar about cart update
      window.dispatchEvent(new Event("cart-updated"));

      toast({
        title: "Item removed",
        description: "The item was removed from your cart.",
      });
    } catch (error) {
      console.error("Error removing item:", error);
      toast({
        title: "Error",
        description: "Failed to remove item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingItems((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  // Fetch cart data on component mount
  useEffect(() => {
    fetchCart();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!cartData || cartData.items.length === 0) {
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

  return (
    <div>
      <div className="divide-y divide-gray-200">
        {cartData.items.map((item) => (
          <div
            key={item.id}
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
              <div className="mt-1 font-semibold">
                {formatPrice(item.product.price)}
              </div>

              <div className="mt-2 flex items-center justify-center sm:justify-start gap-2">
                <span className="text-sm text-gray-600">
                  Qty: {item.quantity}
                </span>
              </div>
            </div>

            {/* Remove Button */}
            <div>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-rose-500"
                onClick={() => removeItem(item.id)}
                disabled={loadingItems[item.id]}
              >
                {loadingItems[item.id] ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Trash2 className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Summary */}
      <div className="border-t border-gray-200 px-6 py-4">
        <div className="flex justify-between text-base font-semibold text-gray-900 mb-1">
          <p>Subtotal</p>
          <p>{formatPrice(cartData.total)}</p>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <p>Shipping</p>
          <p>Calculated at checkout</p>
        </div>
      </div>
    </div>
  );
}

// Loading component
function ShoppingBag(props: React.ComponentProps<typeof Loader2>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
      <path d="M3 6h18"></path>
      <path d="M16 10a4 4 0 0 1-8 0"></path>
    </svg>
  );
}
