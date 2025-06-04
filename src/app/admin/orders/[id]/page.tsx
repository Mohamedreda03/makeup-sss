import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, User, Package, Mail, Phone } from "lucide-react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// تهيئة إضافات dayjs
dayjs.extend(utc);
dayjs.extend(timezone);
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
    currency: "EGP",
  }).format(price);
}

export default async function OrderDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  // Check if user is admin
  await checkAdmin(); // Fetch order details including payment information
  const order = await db.order.findUnique({
    where: { id: params.id },
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

  console.log("Fetched order details:", order);

  // If order not found, show 404
  if (!order) {
    notFound();
  } // Calculate total from payment amount (with discount) or fallback to order details
  const orderTotal = order.payment
    ? order.payment.amount // Use actual payment amount (includes discount)
    : order.order_details.reduce(
        // Fallback to calculated total
        (total: number, item: any) => total + item.price * item.quantity,
        0
      );
  return (
    <div className="px-1 py-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            asChild
            className="rounded-full shadow-sm hover:shadow-md transition-all"
          >
            <Link href="/admin/orders">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to Orders</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
              Order Details
            </h1>
            <p className="text-sm text-gray-500">
              Order ID:{" "}
              <span className="font-medium text-gray-700">
                {order.id.slice(0, 12)}...
              </span>
            </p>
          </div>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order Info */}
        <Card className="md:col-span-2">
          {" "}
          <CardHeader>
            <CardTitle>Order Items</CardTitle>{" "}
            <CardDescription className="flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
              Placed on{" "}
              {dayjs(order.order_date || order.createdAt)
                .tz("Africa/Cairo")
                .format("MMMM D, YYYY [at] h:mm A")}
            </CardDescription>
          </CardHeader>{" "}
          <CardContent>
            {order.order_details.map(
              (item: OrderDetailsWithProduct, index: number) => (
                <div
                  key={`${item.order_id}-${item.product_id}`}
                  className="flex items-center gap-4 py-4 border-b last:border-0 hover:bg-gray-50/50 p-2 rounded-md transition-colors"
                >
                  <div className="relative h-20 w-20 rounded-md overflow-hidden flex-shrink-0 border shadow-sm">
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
                    <div className="font-medium text-gray-900">
                      {item.product?.name || "Unknown Product"}
                    </div>
                    <div className="flex gap-4 mt-1">
                      <div className="text-sm bg-purple-50 text-purple-700 px-2 py-1 rounded-full shadow-sm">
                        Qty: {item.quantity}
                      </div>
                      <div className="text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded-full shadow-sm">
                        {formatPrice(item.price)}
                      </div>
                    </div>
                  </div>
                  <div className="font-medium text-lg text-green-600">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              )
            )}{" "}
            <div className="mt-6 flex justify-end">
              <div className="space-y-3">
                {" "}
                {/* Show discount information if applicable */}
                {(() => {
                  const calculatedSubtotal = order.order_details.reduce(
                    (total: number, item: any) =>
                      total + item.price * item.quantity,
                    0
                  );
                  const actualTotal = order.payment
                    ? order.payment.amount
                    : calculatedSubtotal;
                  const discountAmount = calculatedSubtotal - actualTotal;

                  if (discountAmount > 5) {
                    // Show discount if more than 5 EGP difference
                    return (
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>Subtotal:</span>
                          <span>{formatPrice(calculatedSubtotal)}</span>
                        </div>
                        <div className="flex justify-between text-green-600 font-medium">
                          <span>Bulk Discount (10%):</span>
                          <span>-{formatPrice(discountAmount)}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
                <div className="bg-gradient-to-r from-rose-50 to-purple-50 p-4 rounded-lg shadow-sm border border-gray-100">
                  {" "}
                  <div className="text-sm text-gray-600 mb-1">
                    {order.payment ? "Amount Paid" : "Order Total"}
                  </div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                    {formatPrice(orderTotal)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Customer and Shipping Info */}{" "}
        <div className="space-y-6">
          {/* Order Status Management */}
          <Card className="border-t-4 border-t-purple-500 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2 text-purple-500" />
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStatusSelector
                orderId={order.id}
                initialStatus={order.status}
              />
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card className="border-t-4 border-t-blue-500 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-500" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.user ? (
                <div className="flex items-start gap-4 p-2 bg-blue-50/50 rounded-lg">
                  <UserObjectAvatar user={order.user} size="md" />
                  <div className="space-y-1">
                    <div className="font-medium text-gray-900">
                      {order.user.name}
                    </div>
                    <div className="text-sm text-gray-700 flex items-center">
                      <Mail className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                      {order.user.email}
                    </div>
                    {order.user.phone && (
                      <div className="text-sm text-gray-700 flex items-center">
                        <Phone className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                        {order.user.phone}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 p-4 bg-gray-50 rounded-lg text-center">
                  Guest checkout
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
