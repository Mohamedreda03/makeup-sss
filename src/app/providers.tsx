"use client";

import { ReactNode, useEffect, useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client
const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait till Next.js rehydration is complete
  useEffect(() => {
    const unsubHydrate = useCartStore.persist.onHydrate(() => {
      setIsHydrated(false);
    });

    const unsubFinishHydration = useCartStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    setIsHydrated(useCartStore.persist.hasHydrated());

    return () => {
      unsubHydrate();
      unsubFinishHydration();
    };
  }, []);

  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

  // Wrap with QueryClientProvider
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
