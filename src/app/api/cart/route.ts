import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Type definitions
interface CartItemRequest {
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string | null;
    category: string;
  };
}

// GET /api/cart - Get user's cart
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ items: [] });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ items: [] });
    }

    const cart = await prisma.cart.findUnique({
      where: { user_id: user.id },
      include: {
        cart_items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart) {
      return NextResponse.json({ items: [] });
    }

    // Transform to match CartItem interface
    const items = cart.cart_items.map((item) => ({
      id: item.id,
      productId: item.product_id,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        imageUrl: item.product.imageUrl || item.product.image,
        category: item.product.category,
      },
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json({ items: [] });
  }
}

// POST /api/cart - Update entire cart
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    const { items } = await request.json();

    // Create or get cart
    let cart = await prisma.cart.findUnique({
      where: { user_id: user.id },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          user_id: user.id,
          total_price: 0,
        },
      });
    } // Clear existing cart items
    await prisma.cartItem.deleteMany({
      where: { cart_id: cart.id },
    });

    // Add new cart items with validation
    if (items.length > 0) {
      // Validate that all products exist before creating cart items
      const productIds = items.map((item: CartItemRequest) => item.productId);
      const existingProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true },
      });

      const existingProductIds = existingProducts.map((p) => p.id);
      const validItems = items.filter((item: CartItemRequest) =>
        existingProductIds.includes(item.productId)
      );

      if (validItems.length > 0) {
        await prisma.cartItem.createMany({
          data: validItems.map((item: CartItemRequest) => ({
            cart_id: cart.id,
            product_id: item.productId,
            quantity: item.quantity,
          })),
        });

        // Update total price with valid items only
        const totalPrice = validItems.reduce(
          (sum: number, item: CartItemRequest) =>
            sum + item.product.price * item.quantity,
          0
        );

        await prisma.cart.update({
          where: { id: cart.id },
          data: { total_price: totalPrice },
        });
      }

      // Log invalid items for debugging
      const invalidItems = items.filter(
        (item: CartItemRequest) => !existingProductIds.includes(item.productId)
      );      if (invalidItems.length > 0) {
        console.warn(
          "Attempted to add non-existent products to cart:",
          invalidItems.map((item: CartItemRequest) => item.productId)
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating cart:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
