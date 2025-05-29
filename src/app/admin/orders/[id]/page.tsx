import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { checkAdmin } from "@/lib/utils/auth-utils";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserObjectAvatar } from "@/components/user-avatar";
import { OrderStatusSelector } from "@/components/order-status-selector";
import { OrderStatusBadge } from "@/components/order-status-badge";

export const metadata = {
  title: "Order Details | Admin Dashboard",
  description: "View and manage order details",
};

// Define interface for order details (matching Prisma schema)
interface OrderDetailsType {
  product_id: string;
  quantity: number;
  price: number;
  type: string;
  order_id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define interface for the order details with its product
interface OrderDetailsWithProduct extends OrderDetailsType {
  product: {
    id: string;
    name: string;
    image: string | null;
    [key: string]: any;
  } | null;
}

// Format currency
function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export default async function OrderDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  // Check if user is admin
  await checkAdmin();
  // Fetch order details
  const order = await db.order.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      order_details: {
        include: {
          product: true,
        },
      },
    },
  });
  // If order not found, show 404
  if (!order) {
    notFound();
  }

  // Calculate total from order details
  const orderTotal = order.order_details.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/orders">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to Orders</span>
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Order Details</h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <div className="text-sm text-gray-500">
          Order ID: {order.id.slice(0, 12)}...
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Order Items</CardTitle>{" "}
            <CardDescription>
              Placed on{" "}
              {format(
                new Date(order.order_date || order.createdAt),
                "MMMM d, yyyy 'at' h:mm a"
              )}
            </CardDescription>
          </CardHeader>{" "}
          <CardContent>
            {order.order_details.map(
              (item: OrderDetailsWithProduct, index: number) => (
                <div
                  key={`${item.order_id}-${item.product_id}`}
                  className="flex items-center gap-4 py-4 border-b last:border-0"
                >
                  <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0 border">
                    {item.product?.image ? (
                      <Image
                        src={item.product.image}
                        alt={item.product.name || "Product"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full bg-gray-100 text-gray-400 text-xs">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="font-medium">
                      {item.product?.name || "Unknown Product"}
                    </div>
                    <div className="text-sm text-gray-500">
                      Quantity: {item.quantity}
                    </div>
                    <div className="text-sm text-gray-500">
                      Price: {formatPrice(item.price)}
                    </div>
                  </div>
                  <div className="font-medium">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              )
            )}

            <div className="mt-4 flex justify-end">
              <div className="space-y-1 text-right">
                <div className="text-sm text-gray-500">Total</div>
                <div className="text-2xl font-bold">
                  {formatPrice(orderTotal)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer and Shipping Info */}
        <div className="space-y-6">
          {/* Order Status Management */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStatusSelector
                orderId={order.id}
                initialStatus={order.status}
              />
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              {order.user ? (
                <div className="flex items-center gap-3">
                  <UserObjectAvatar user={order.user} size="md" />
                  <div>
                    <div className="font-medium">{order.user.name}</div>
                    <div className="text-sm text-gray-500">
                      {order.user.email}
                    </div>
                    {order.user.phone && (
                      <div className="text-sm text-gray-500">
                        {order.user.phone}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">Guest checkout</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
