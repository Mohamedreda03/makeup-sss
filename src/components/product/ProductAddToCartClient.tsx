"use client";

import { useState } from "react";
import { ShoppingCart, Minus, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/product";
import { useCartStore } from "@/store/useCartStore";

interface ProductAddToCartClientProps {
  product: Product;
}

export default function ProductAddToCartClient({
  product,
}: ProductAddToCartClientProps) {
  const [quantity, setQuantity] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const { addItem } = useCartStore();

  const handleAddToCart = () => {
    if (product.stock_quantity <= 0 || !product.inStock) return;

    // Prepare product data for cart
    const cartProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.image || product.imageUrl || null,
      category: product.category,
    };

    // Add to cart with immediate updates
    addItem(cartProduct, quantity);

    // Show success animation
    setShowSuccess(true);

    // Reset quantity after adding
    setQuantity(1);

    // Hide success animation after 2 seconds
    setTimeout(() => {
      setShowSuccess(false);
    }, 2000);
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
      {/* Quantity Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Quantity:</span>
        <div className="flex items-center border border-gray-300 rounded-md">
          <Button
            variant="ghost"
            size="sm"
            onClick={decrementQuantity}
            disabled={quantity <= 1}
            className="h-8 w-8 p-0"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="px-3 py-1 text-sm font-medium">{quantity}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={incrementQuantity}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stock Status */}
      {product.stock_quantity <= 0 || !product.inStock ? (
        <p className="text-red-500 text-sm">Out of stock</p>
      ) : (
        <p className="text-green-600 text-sm">
          {product.stock_quantity} items in stock
        </p>
      )}

      {/* Add to cart button */}
      <Button
        onClick={handleAddToCart}
        disabled={product.stock_quantity <= 0 || !product.inStock}
        className={`w-full transition-all duration-300 ${
          showSuccess
            ? "bg-green-500 hover:bg-green-600 scale-105"
            : "bg-rose-500 hover:bg-rose-600"
        } text-white`}
      >
        {showSuccess ? (
          <div className="flex items-center animate-pulse">
            <Check className="mr-2 h-4 w-4 animate-bounce" />
            Added Successfully!
          </div>
        ) : (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
          </>
        )}
      </Button>
    </div>
  );
}
