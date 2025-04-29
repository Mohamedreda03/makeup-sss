import { Suspense } from "react";
import Link from "next/link";
import { checkAdmin } from "@/lib/utils/auth-utils";
import { db } from "@/lib/db";
import { Order, OrderStatus } from "@/generated/prisma";
import { format } from "date-fns";
import { Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { StatusFilter } from "@/components/status-filter";

export const metadata = {
  title: "Orders | Admin Dashboard",
  description: "Manage orders and view order details",
};

// Interface for order with included relations
interface OrderWithRelations extends Order {
  user: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  items: any[];
}

// Format price
function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

// Orders table skeleton for loading state
function OrdersTableSkeleton() {
  return (
    <div className="rounded-md border bg-white dark:bg-gray-950">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-20 rounded-full" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-4 w-16 ml-auto" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8 rounded-full" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Main orders list component
async function OrdersList({ status }: { status: OrderStatus | "ALL" }) {
  // Prepare filter based on status
  const filter = status === "ALL" ? {} : { status };

  // Fetch orders with filter
  const orders = await db.order.findMany({
    where: filter,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  return (
    <div>
      <div className="rounded-md border bg-white dark:bg-gray-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-10 text-gray-500"
                >
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order: OrderWithRelations) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {order.user?.name || "Guest"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.user?.email || "No email"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatPrice(order.total)}
                  </TableCell>
                  <TableCell>
                    {format(new Date(order.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/orders/${order.id}`}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View order</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  // Check if user is admin
  await checkAdmin();

  // Get status filter from query params, default to ALL
  const status = (searchParams.status as OrderStatus) || "ALL";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Orders</h1>
        <StatusFilter currentStatus={status} />
      </div>

      <Suspense fallback={<OrdersTableSkeleton />}>
        <OrdersList status={status} />
      </Suspense>
    </div>
  );
}
