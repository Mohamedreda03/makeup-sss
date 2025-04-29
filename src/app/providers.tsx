"use client";

import { ReactNode, useEffect, useState } from "react";
import { useCartStore } from "@/store/useCartStore";

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

  return children;
}
