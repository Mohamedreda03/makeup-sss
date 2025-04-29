"use client";

import { useRef } from "react";
import { useCartStore } from "./useCartStore";

type StoreInitializerProps = {
  cartItems?: number;
};

// This component helps us avoid hydration mismatches by initializing the store
// with the server value but only on the first render
export function StoreInitializer({ cartItems = 0 }: StoreInitializerProps) {
  const initialized = useRef(false);

  if (!initialized.current) {
    // Only set the itemCount - we'll load the real cart items client-side
    if (cartItems > 0) {
      useCartStore.setState({ itemCount: cartItems });
    }
    initialized.current = true;
  }

  return null;
}
