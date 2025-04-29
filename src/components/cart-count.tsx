"use client";

import { useEffect, useState } from "react";

export function CartCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // استخراج عدد العناصر من localStorage
    const getCartCount = () => {
      if (typeof window === "undefined") return 0;

      try {
        const cart = localStorage.getItem("shopping-cart");
        if (!cart) return 0;

        const cartItems = JSON.parse(cart);
        return Array.isArray(cartItems)
          ? cartItems.reduce((total, item) => total + (item.quantity || 1), 0)
          : Object.values(cartItems).reduce(
              (total, item: any) => total + (item.quantity || 1),
              0
            );
      } catch (error) {
        console.error("Error reading cart from localStorage", error);
        return 0;
      }
    };

    // تعيين العدد الأولي
    setCount(getCartCount());

    // إعداد مستمع للتغييرات في localStorage
    const handleStorageChange = () => {
      setCount(getCartCount());
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("cart-update", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cart-update", handleStorageChange);
    };
  }, []);

  if (count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
      {count > 99 ? "99+" : count}
    </span>
  );
}
