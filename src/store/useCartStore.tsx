"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Types
export interface CartProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  category: string;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: CartProduct;
}

interface CartState {
  items: CartItem[];
  itemCount: number;
  total: number;
  isLoading: boolean;
  isInitialized: boolean;
}

interface CartActions {
  addItem: (product: CartProduct, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  syncWithDatabase: () => Promise<void>;
  loadFromDatabase: () => Promise<void>;
}

type CartStore = CartState & CartActions;

// Helper functions
const generateId = () =>
  `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const calculateStats = (items: CartItem[]) => {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  return { itemCount, total };
};

// Database sync functions
const syncCartToDatabase = async (items: CartItem[]) => {
  try {
    if (typeof window === "undefined") return;

    await fetch("/api/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items }),
    });
  } catch (error) {
    console.error("Failed to sync cart to database:", error);
  }
};

const loadCartFromDatabase = async (): Promise<CartItem[]> => {
  try {
    if (typeof window === "undefined") return [];

    const response = await fetch("/api/cart");
    if (!response.ok) return [];

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Failed to load cart from database:", error);
    return [];
  }
};

// Store
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      itemCount: 0,
      total: 0,
      isLoading: false,
      isInitialized: false,

      // Load from database if no local storage data
      loadFromDatabase: async () => {
        const { isInitialized } = get();
        if (isInitialized) return;

        set({ isLoading: true });

        try {
          const dbItems = await loadCartFromDatabase();
          if (dbItems.length > 0) {
            const stats = calculateStats(dbItems);
            set({
              items: dbItems,
              ...stats,
              isInitialized: true,
              isLoading: false,
            });
          } else {
            set({ isInitialized: true, isLoading: false });
          }
        } catch (error) {
          console.error("Failed to load cart from database:", error);
          set({ isInitialized: true, isLoading: false });
        }
      },

      // Sync current cart to database
      syncWithDatabase: async () => {
        const { items } = get();
        await syncCartToDatabase(items);
      },

      // Actions
      addItem: (product: CartProduct, quantity = 1) => {
        const { items } = get();
        const existingItemIndex = items.findIndex(
          (item) => item.productId === product.id
        );

        let newItems: CartItem[];

        if (existingItemIndex >= 0) {
          // Update existing item
          newItems = [...items];
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: newItems[existingItemIndex].quantity + quantity,
          };
        } else {
          // Add new item
          const newItem: CartItem = {
            id: generateId(),
            productId: product.id,
            quantity,
            product,
          };
          newItems = [...items, newItem];
        }

        const stats = calculateStats(newItems);
        set({ items: newItems, ...stats });

        // Sync to database in background
        syncCartToDatabase(newItems);
      },

      removeItem: (itemId: string) => {
        const { items } = get();
        const newItems = items.filter((item) => item.id !== itemId);
        const stats = calculateStats(newItems);
        set({ items: newItems, ...stats });

        // Sync to database in background
        syncCartToDatabase(newItems);
      },

      updateQuantity: (itemId: string, quantity: number) => {
        if (quantity <= 0) return;

        const { items } = get();
        const newItems = items.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        );
        const stats = calculateStats(newItems);
        set({ items: newItems, ...stats });

        // Sync to database in background
        syncCartToDatabase(newItems);
      },

      clearCart: () => {
        set({ items: [], itemCount: 0, total: 0 });

        // Sync to database in background
        syncCartToDatabase([]);
      },
    }),
    {
      name: "cart-storage",
      onRehydrateStorage: () => (state) => {
        // Load from database if no items in storage
        if (state && state.items.length === 0 && !state.isInitialized) {
          state.loadFromDatabase();
        } else if (state) {
          state.isInitialized = true;
        }
      },
    }
  )
);
