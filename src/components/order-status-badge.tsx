import { OrderStatus } from "@/generated/prisma";
import { Badge } from "@/components/ui/badge";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({
  status,
  className = "",
}: OrderStatusBadgeProps) {
  const statusConfig = {
    PENDING: { className: "bg-amber-100 text-amber-800", label: "Pending" },
    PROCESSING: { className: "bg-blue-100 text-blue-800", label: "Processing" },
    COMPLETED: { className: "bg-green-100 text-green-800", label: "Completed" },
    CANCELLED: { className: "bg-red-100 text-red-800", label: "Cancelled" },
  };

  const config = statusConfig[status];

  return (
    <Badge className={`${config.className} ${className}`} variant="outline">
      {config.label}
    </Badge>
  );
}
