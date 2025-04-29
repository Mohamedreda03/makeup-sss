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
import { OrderItem } from "@/generated/prisma";

export const metadata = {
  title: "Order Details | Admin Dashboard",
  description: "View and manage order details",
};

// Define interface for the order item with its product
interface OrderItemWithProduct extends OrderItem {
  product: {
    id: string;
    imageUrl: string | null;
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
      items: {
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

  // Parse shipping info from JSON
  const shippingInfo = order.shippingInfo
    ? JSON.parse(order.shippingInfo as string)
    : null;

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
            <CardTitle>Order Items</CardTitle>
            <CardDescription>
              Placed on{" "}
              {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {order.items.map((item: OrderItemWithProduct) => (
              <div
                key={item.id}
                className="flex items-center gap-4 py-4 border-b last:border-0"
              >
                <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0 border">
                  {item.product?.imageUrl ? (
                    <Image
                      src={item.product.imageUrl}
                      alt={item.name}
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
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-500">
                    Quantity: {item.quantity}
                  </div>
                </div>
                <div className="font-medium">
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            ))}

            <div className="mt-4 flex justify-end">
              <div className="space-y-1 text-right">
                <div className="text-sm text-gray-500">Total</div>
                <div className="text-2xl font-bold">
                  {formatPrice(order.total)}
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

          {/* Shipping Info */}
          {shippingInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="font-medium">{shippingInfo.fullName}</div>
                  <div className="text-sm text-gray-500">
                    {shippingInfo.email}
                  </div>
                  {shippingInfo.phone && (
                    <div className="text-sm text-gray-500">
                      {shippingInfo.phone}
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="text-sm">
                    {shippingInfo.address}
                    {shippingInfo.city && (
                      <>
                        <br />
                        {shippingInfo.city}
                        {shippingInfo.state && `, ${shippingInfo.state}`}{" "}
                        {shippingInfo.zip && shippingInfo.zip}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
