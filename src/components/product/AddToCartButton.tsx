"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Product } from "@/types/product";
import { useCartStore } from "@/store/useCartStore";

interface AddToCartButtonProps {
  product: Product;
  quantity?: number;
  className?: string;
}

export default function AddToCartButton({
  product,
  quantity = 1,
  className,
}: AddToCartButtonProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const { addItem } = useCartStore();

  const addToCart = () => {
    if (product.stock_quantity <= 0) {
      toast({
        title: "Product out of stock",
        description: "Sorry, this product is currently out of stock.",
        variant: "destructive",
      });
      return;
    }

    try {
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

      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      });

      // Show success animation
      setShowSuccess(true);

      // Hide success animation after 2 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={addToCart}
      disabled={product.stock_quantity <= 0}
      className={`w-full transition-all duration-300 ${
        showSuccess
          ? "bg-green-500 hover:bg-green-600 scale-105"
          : "bg-rose-500 hover:bg-rose-600"
      } ${className}`}
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
  );
}
