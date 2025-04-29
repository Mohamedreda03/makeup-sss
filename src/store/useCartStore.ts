import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "@/components/ui/use-toast";

export interface CartProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  category: string;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: CartProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      itemCount: 0,
      total: 0,

      addItem: (product, quantity = 1) => {
        const { items } = get();
        const existingItem = items.find(
          (item) => item.product.id === product.id
        );

        if (existingItem) {
          // If item already exists, update quantity
          const updatedItems = items.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );

          set((state) => ({
            items: updatedItems,
            itemCount: state.itemCount + quantity,
            total: state.total + product.price * quantity,
          }));

          toast({
            title: "Cart updated",
            description: `Updated ${product.name} quantity in your cart`,
          });
        } else {
          // Add new item
          set((state) => ({
            items: [...state.items, { product, quantity }],
            itemCount: state.itemCount + quantity,
            total: state.total + product.price * quantity,
          }));

          toast({
            title: "Added to cart",
            description: `${product.name} has been added to your cart`,
          });
        }

        // Dispatch custom event to notify navbar about cart update
        window.dispatchEvent(new Event("cart-updated"));
      },

      removeItem: (productId) => {
        const { items } = get();
        const itemToRemove = items.find(
          (item) => item.product.id === productId
        );

        if (!itemToRemove) return;

        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
          itemCount: state.itemCount - itemToRemove.quantity,
          total:
            state.total - itemToRemove.product.price * itemToRemove.quantity,
        }));

        toast({
          title: "Item removed",
          description: "The item was removed from your cart",
        });

        // Dispatch custom event to notify navbar about cart update
        window.dispatchEvent(new Event("cart-updated"));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity < 1) return;

        const { items } = get();
        const existingItem = items.find(
          (item) => item.product.id === productId
        );

        if (!existingItem) return;

        const quantityDiff = quantity - existingItem.quantity;

        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
          itemCount: state.itemCount + quantityDiff,
          total: state.total + existingItem.product.price * quantityDiff,
        }));

        // Dispatch custom event to notify navbar about cart update
        window.dispatchEvent(new Event("cart-updated"));
      },

      clearCart: () => {
        set({
          items: [],
          itemCount: 0,
          total: 0,
        });

        // Dispatch custom event to notify navbar about cart update
        window.dispatchEvent(new Event("cart-updated"));
      },
    }),
    {
      name: "makeup-cart",
      skipHydration: true, // For Next.js to avoid hydration mismatches
    }
  )
);
