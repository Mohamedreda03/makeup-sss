"use client";

import { useState } from "react";
import { Loader2, ShoppingCart, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/product";
import { useCartStore, CartProduct } from "@/store/useCartStore";

interface ProductAddToCartClientProps {
  product: Product;
}

export default function ProductAddToCartClient({
  product,
}: ProductAddToCartClientProps) {
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = async () => {
    if (!product.inStock) return;

    try {
      setIsLoading(true);

      // Map product to cart product format
      const cartProduct: CartProduct = {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        category: product.category,
      };

      // Add to cart using Zustand
      addItem(cartProduct, quantity);

      // Reset quantity after adding
      setQuantity(1);
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const incrementQuantity = () => {
    setQuantity(quantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Quantity selector */}
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-700">Quantity</span>
        <div className="flex items-center border rounded-lg overflow-hidden">
          <button
            type="button"
            className="p-2 text-gray-600 hover:bg-gray-100 focus:outline-none"
            onClick={decrementQuantity}
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="px-4 py-2 text-center w-12">{quantity}</span>
          <button
            type="button"
            className="p-2 text-gray-600 hover:bg-gray-100 focus:outline-none"
            onClick={incrementQuantity}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Add to cart button */}
      <Button
        onClick={handleAddToCart}
        disabled={isLoading || !product.inStock}
        className="w-full bg-rose-500 hover:bg-rose-600 text-white"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
          </>
        ) : (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
          </>
        )}
      </Button>
    </div>
  );
}
