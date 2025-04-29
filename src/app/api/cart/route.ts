import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Helper function to get or create a cart
async function getOrCreateCart(
  userId?: string | null,
  sessionId?: string | null
) {
  // Try to find existing cart
  let cart = await db.cart.findFirst({
    where: {
      OR: [{ userId: userId || null }, { sessionId: sessionId || null }],
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  // If no cart exists, create a new one
  if (!cart) {
    cart = await db.cart.create({
      data: {
        userId: userId || null,
        sessionId: userId ? null : sessionId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  return cart;
}

// GET - Retrieve cart contents
export async function GET() {
  try {
    // Check if user is authenticated
    const session = await auth();
    const userId = session?.user?.id || null;

    // Get the session ID from cookies or create a new one
    const cookieStore = cookies();
    let sessionId = cookieStore.get("cart-session-id")?.value || null;

    if (!userId && !sessionId) {
      const newSessionId = uuidv4();
      cookieStore.set("cart-session-id", newSessionId);
      sessionId = newSessionId;
    }

    // Get or create a cart
    const cart = await getOrCreateCart(userId, sessionId);

    // Return simplified cart data
    return NextResponse.json({
      id: cart.id,
      items: cart.items.map((item: (typeof cart.items)[0]) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          imageUrl: item.product.imageUrl,
          category: item.product.category,
        },
      })),
      itemCount: cart.items.reduce(
        (acc: number, item: (typeof cart.items)[0]) => acc + item.quantity,
        0
      ),
      total: cart.items.reduce(
        (acc: number, item: (typeof cart.items)[0]) =>
          acc + item.product.price * item.quantity,
        0
      ),
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

// POST - Add item to cart
export async function POST(req: NextRequest) {
  try {
    const { productId, quantity = 1 } = await req.json();

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Check if product exists and is in stock
    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (!product.inStock) {
      return NextResponse.json(
        { error: "Product is out of stock" },
        { status: 400 }
      );
    }

    // Check if user is authenticated
    const session = await auth();
    const userId = session?.user?.id || null;

    // Get the session ID from cookies or create a new one
    const cookieStore = cookies();
    let sessionId = cookieStore.get("cart-session-id")?.value || null;

    if (!userId && !sessionId) {
      const newSessionId = uuidv4();
      // Set the cookie with an expiration
      cookieStore.set("cart-session-id", newSessionId, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });
      sessionId = newSessionId;
    }

    // Get or create a cart
    const cart = await getOrCreateCart(userId, sessionId);

    // Check if the item already exists in the cart
    const existingItem = await db.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
      },
    });

    if (existingItem) {
      // Update the quantity
      const updatedItem = await db.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
        },
        include: {
          product: true,
        },
      });

      return NextResponse.json({
        message: "Cart updated successfully",
        item: {
          id: updatedItem.id,
          productId: updatedItem.productId,
          quantity: updatedItem.quantity,
          product: {
            id: updatedItem.product.id,
            name: updatedItem.product.name,
            price: updatedItem.product.price,
          },
        },
      });
    } else {
      // Add a new item
      const newItem = await db.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
        include: {
          product: true,
        },
      });

      return NextResponse.json({
        message: "Item added to cart",
        item: {
          id: newItem.id,
          productId: newItem.productId,
          quantity: newItem.quantity,
          product: {
            id: newItem.product.id,
            name: newItem.product.name,
            price: newItem.product.price,
          },
        },
      });
    }
  } catch (error) {
    console.error("Error adding item to cart:", error);
    return NextResponse.json(
      { error: "Failed to add item to cart" },
      { status: 500 }
    );
  }
}

// DELETE - Remove item from cart
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const itemId = url.searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    // Delete the item
    await db.cartItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({
      message: "Item removed from cart",
    });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    return NextResponse.json(
      { error: "Failed to remove item from cart" },
      { status: 500 }
    );
  }
}
