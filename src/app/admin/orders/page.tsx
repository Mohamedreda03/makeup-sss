import { Suspense } from "react";
import Link from "next/link";
import { checkAdmin } from "@/lib/utils/auth-utils";
import { db } from "@/lib/db";
import { Order, OrderStatus } from "@/generated/prisma";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// تهيئة إضافات dayjs
dayjs.extend(utc);
dayjs.extend(timezone);
import { Eye, Calendar } from "lucide-react";
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

// Interface for order details
interface OrderDetails {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    price: number;
  } | null;
}

// Interface for order with included relations
interface OrderWithRelations extends Order {
  user: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  order_details: OrderDetails[];
  payment: {
    id: string;
    amount: number;
    method: string;
    payment_status: string;
    date: Date;
  } | null;
}

// Format price
function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EGP",
  }).format(price);
}

// Orders table skeleton for loading state
function OrdersTableSkeleton() {
  return (
    <div className="rounded-md border border-gray-200 bg-white dark:bg-gray-950 shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50 dark:bg-gray-900">
          <TableRow className="border-b">
            <TableHead className="py-3 font-semibold text-gray-700 dark:text-gray-300">
              Order ID
            </TableHead>
            <TableHead className="py-3 font-semibold text-gray-700 dark:text-gray-300">
              Customer
            </TableHead>
            <TableHead className="py-3 font-semibold text-gray-700 dark:text-gray-300">
              Status
            </TableHead>
            <TableHead className="py-3 font-semibold text-gray-700 dark:text-gray-300">
              Total
            </TableHead>
            <TableHead className="py-3 font-semibold text-gray-700 dark:text-gray-300">
              Date
            </TableHead>
            <TableHead className="py-3 font-semibold text-gray-700 dark:text-gray-300">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow
              key={i}
              className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
            >
              <TableCell className="py-3">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-5 w-5 rounded-md" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </TableCell>
              <TableCell className="py-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-3">
                <Skeleton className="h-6 w-24 rounded-full" />
              </TableCell>
              <TableCell className="text-right py-3">
                <Skeleton className="h-4 w-20 ml-auto" />
              </TableCell>
              <TableCell className="py-3">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-3">
                <Skeleton className="h-8 w-16 rounded-md" />
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
  const filter = status === "ALL" ? {} : { status }; // Fetch orders with filter including payment information
  const orders = await db.order.findMany({
    where: filter,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: true,
      order_details: {
        include: {
          product: true,
        },
      },
      payment: true, // Include payment information to get actual amount paid
    },
  });
  return (
    <div>
      <div className="rounded-md border border-gray-200 bg-white dark:bg-gray-950 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-gray-900">
            <TableRow className="border-b">
              <TableHead className="py-3 font-semibold text-gray-700 dark:text-gray-300">
                Order ID
              </TableHead>
              <TableHead className="py-3 font-semibold text-gray-700 dark:text-gray-300">
                Customer
              </TableHead>
              <TableHead className="py-3 font-semibold text-gray-700 dark:text-gray-300">
                Status
              </TableHead>
              <TableHead className="py-3 font-semibold text-gray-700 dark:text-gray-300">
                Total
              </TableHead>
              <TableHead className="py-3 font-semibold text-gray-700 dark:text-gray-300">
                Date
              </TableHead>
              <TableHead className="text-center py-3 font-semibold text-gray-700 dark:text-gray-300">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {" "}
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 px-4">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                      <Calendar className="h-8 w-8 text-amber-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      No Orders Found
                    </h3>
                    <p className="text-gray-500 max-w-sm text-center">
                      No orders matching your selected filter criteria
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Try changing filters or check back later
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order: OrderWithRelations) => (
                <TableRow
                  key={order.id}
                  className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                >
                  {" "}
                  <TableCell className="py-3">
                    <div className="font-medium flex items-center space-x-1">
                      <span className="bg-rose-50 text-rose-600 px-2 py-1 rounded text-xs font-bold shadow-sm">
                        #
                      </span>
                      <span>{order.id.slice(0, 8)}</span>
                    </div>
                  </TableCell>{" "}
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium shadow-sm">
                        {order.user?.name?.[0]?.toUpperCase() || "G"}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {order.user?.name || "Guest"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.user?.email || "No email"}
                        </div>
                      </div>
                    </div>
                  </TableCell>{" "}
                  <TableCell className="py-3">
                    <OrderStatusBadge status={order.status} />
                  </TableCell>{" "}
                  <TableCell className="py-3">
                    <div className="font-medium text-green-600">
                      {/* Display actual payment amount (with discount) instead of calculating from items */}
                      {order.payment
                        ? formatPrice(order.payment.amount)
                        : formatPrice(
                            order.order_details.reduce(
                              (total, item) =>
                                total + item.price * item.quantity,
                              0
                            )
                          )}
                    </div>
                  </TableCell>{" "}
                  <TableCell>
                    <div className="flex items-center space-x-1.5">
                      <div className="rounded-full bg-gradient-to-r from-rose-50 to-pink-50 p-1.5 shadow-sm">
                        <Calendar className="h-3.5 w-3.5 text-rose-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {(() => {
                            try {
                              // Format date with dayjs in Egypt timezone
                              return dayjs(order.createdAt)
                                .tz("Africa/Cairo")
                                .format("MMM D, YYYY");
                            } catch {
                              return "Date not available";
                            }
                          })()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {(() => {
                            try {
                              // Add time display
                              return dayjs(order.createdAt)
                                .tz("Africa/Cairo")
                                .format("h:mm A");
                            } catch {
                              return "";
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                  </TableCell>{" "}
                  <TableCell className="text-center py-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                      asChild
                    >
                      <Link href={`/admin/orders/${order.id}`}>
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        <span>View</span>
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
    <div className="px-1 py-2">
      {" "}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
            Orders
          </h1>
          <p className="text-gray-500 mt-1">Manage and track customer orders</p>
        </div>
        <div className="bg-white p-1.5 rounded-lg shadow-sm border">
          <StatusFilter currentStatus={status} />
        </div>
      </div>
      <Suspense fallback={<OrdersTableSkeleton />}>
        <OrdersList status={status} />
      </Suspense>
    </div>
  );
}
