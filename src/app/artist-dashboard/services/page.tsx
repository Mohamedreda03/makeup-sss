"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ServiceManager from "@/components/services/ServiceManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

// Create a client
const queryClient = new QueryClient();

export default function ArtistServicesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      setIsLoading(false);

      // Check if user is an artist, redirect if not
      if (session?.user?.role !== "ARTIST") {
        router.push("/");
        toast({
          title: "Access Denied",
          description: "Only artists can access this dashboard",
          variant: "destructive",
        });
      }
    }
  }, [session, status, router]);

  // If loading or not authenticated
  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  // If not authenticated
  if (status === "unauthenticated") {
    router.push("/sign-in?callbackUrl=/artist-dashboard/services");
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Manage Your Services</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-gray-500">
              Add and manage the services you offer to your clients. Services
              that are marked as active will be visible to clients on your
              profile.
            </p>

            {session?.user?.id && <ServiceManager userId={session.user.id} />}
          </CardContent>
        </Card>
      </div>
    </QueryClientProvider>
  );
}
