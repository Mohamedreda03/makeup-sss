"use client";

import { useCartStore } from "@/store/useCartStore";
import { useEffect, useState } from "react";

export function CartCount() {
  const { itemCount } = useCartStore();
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || itemCount === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
      {itemCount > 99 ? "99+" : itemCount}
    </span>
  );
}
