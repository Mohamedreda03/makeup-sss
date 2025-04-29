"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StatusFilterProps {
  currentStatus: string;
}

export function StatusFilter({ currentStatus }: StatusFilterProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <Select
        defaultValue={currentStatus}
        onValueChange={(value) => {
          // Update URL with the new status filter
          const url = new URL(window.location.href);
          if (value === "ALL") {
            url.searchParams.delete("status");
          } else {
            url.searchParams.set("status", value);
          }
          router.push(url.pathname + url.search);
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Orders</SelectItem>
          <SelectItem value="PENDING">Pending</SelectItem>
          <SelectItem value="PROCESSING">Processing</SelectItem>
          <SelectItem value="COMPLETED">Completed</SelectItem>
          <SelectItem value="CANCELLED">Cancelled</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
