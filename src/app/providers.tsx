"use client";

import { ReactNode, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client
const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);

  // Simple hydration check
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Don't render children until hydration is complete to avoid mismatches
  if (!isHydrated) {
    return null;
  }

  // Wrap with QueryClientProvider
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
