import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
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
  phone?: string;
  address: string;
  city: string;
  state?: string;
  zip?: string;
}

interface PaymentInfo {
  cardLast4: string;
}

interface OrderPayload {
  shippingInfo: ShippingInfo;
  paymentInfo: PaymentInfo;
  items: OrderItem[];
  total: number;
}

export const dynamic = "force-dynamic";

// POST - Create a new order
export async function POST(request: NextRequest) {
  try {
    // Get the current session
    const session = await auth();
    const userId = session?.user?.id || null;

    // Get session ID from cookies or generate new one
    const cookieStore = cookies();
    let sessionId = cookieStore.get("cart-session-id")?.value || null;

    // Get order details from request
    const orderPayload: OrderPayload = await request.json();
    const { shippingInfo, paymentInfo, items, total } = orderPayload;

    if (!shippingInfo) {
      return NextResponse.json(
        { error: "Shipping information is required" },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    // Create order with Prisma
    const order = await db.order.create({
      data: {
        id: uuidv4(),
        userId: userId,
        sessionId: userId ? null : sessionId,
        status: OrderStatus.PROCESSING,
        total,
        shippingInfo: JSON.stringify(shippingInfo),
        paymentInfo: JSON.stringify(paymentInfo),
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            name: item.name,
          })),
        },
      },
    });

    return NextResponse.json(
      { success: true, orderId: order.id },
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
