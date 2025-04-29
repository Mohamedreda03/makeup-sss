"use client";

import { useState } from "react";
import { OrderStatus } from "@/generated/prisma";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface OrderStatusSelectorProps {
  orderId: string;
  initialStatus: OrderStatus;
}

export function OrderStatusSelector({
  orderId,
  initialStatus,
}: OrderStatusSelectorProps) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStatusChange = async () => {
    if (status === initialStatus) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update order status");
      }

      toast.success("Order status updated successfully");
      router.refresh(); // Refresh the page to show updated status
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update order status"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const statusOptions = Object.values(OrderStatus);

  return (
    <div className="flex flex-col space-y-4">
      <h3 className="font-medium text-gray-900">Update Order Status</h3>
      <div className="flex items-center space-x-2">
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as OrderStatus)}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option.charAt(0) + option.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={handleStatusChange}
          disabled={status === initialStatus || isLoading}
          className="bg-rose-500 hover:bg-rose-600"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Status"
          )}
        </Button>
      </div>
    </div>
  );
}
