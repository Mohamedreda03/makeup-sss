import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { OrderStatus } from "@/generated/prisma";

// Type definitions for order payload
interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
}

interface ShippingInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface PaymentInfo {
  cardLast4: string;
}

interface OrderPayload {
  items: OrderItem[];
  total: number;
  shippingInfo: ShippingInfo;
  paymentInfo: PaymentInfo;
}

export const dynamic = "force-dynamic";

// POST - Create a new order
export async function POST(request: NextRequest) {
  try {
    // Get the current session
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get order details from request
    const orderPayload: OrderPayload = await request.json();
    const { items, total, shippingInfo, paymentInfo } = orderPayload;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    // Validate required shipping information
    if (
      !shippingInfo.fullName ||
      !shippingInfo.email ||
      !shippingInfo.address ||
      !shippingInfo.city
    ) {
      return NextResponse.json(
        { error: "Missing required shipping information" },
        { status: 400 }
      );
    }

    // Create order with Prisma transaction to ensure consistency
    const result = await db.$transaction(async (prisma) => {
      // Create the main order
      const order = await prisma.order.create({
        data: {
          id: crypto.randomUUID(),
          user_id: userId,
          status: OrderStatus.PROCESSING,
          order_date: new Date(),
          payment_status: "completed",
          order_details: {
            create: items.map((item) => ({
              id: crypto.randomUUID(),
              product_id: item.productId,
              quantity: item.quantity,
              price: item.price,
              type: "purchase",
            })),
          },
        },
      });

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          id: crypto.randomUUID(),
          order_id: order.id,
          amount: total,
          method: `Card ending in ${paymentInfo.cardLast4}`,
          payment_status: "completed",
          date: new Date(),
        },
      });

      return { order, payment };
    });
    console.log("Order created successfully:", {
      orderId: result.order.id,
      paymentId: result.payment.id,
      shippingInfo: {
        name: shippingInfo.fullName,
        email: shippingInfo.email,
        address: shippingInfo.address,
        city: shippingInfo.city,
      },
      itemCount: items.length,
      total: total,
      // Log to verify if discount was applied (3+ items should have lower total)
      hasDiscountApplied: items.length >= 3,
    });

    return NextResponse.json(
      { success: true, orderId: result.order.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
