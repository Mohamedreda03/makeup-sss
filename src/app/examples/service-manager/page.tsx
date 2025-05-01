"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ServiceManager from "@/components/services/ServiceManager";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Create a client
const queryClient = new QueryClient();

export default function ServiceManagerExample() {
  const [userId, setUserId] = useState("");
  const [activeUserId, setActiveUserId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveUserId(userId);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-8">Service Manager Example</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Enter Artist ID</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">
                  Artist ID
                </label>
                <Input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter artist ID"
                  required
                />
              </div>
              <Button type="submit" disabled={!userId}>
                Load Services
              </Button>
            </form>
          </CardContent>
        </Card>

        {activeUserId && (
          <div>
            <ServiceManager userId={activeUserId} />
          </div>
        )}
      </div>
    </QueryClientProvider>
  );
}
