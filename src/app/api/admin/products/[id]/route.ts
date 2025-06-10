import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// Extended user interface
interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: "CUSTOMER" | "ADMIN" | "ARTIST";
}

// GET function to retrieve a single product by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await db.product.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const user = session.user as ExtendedUser;

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      name,
      price,
      description,
      category,
      image,
      stock_quantity,
      featured,
      inStock, // Add support for toggling inStock status
    } = body;

    // For non-delete operations, name and price are required
    if (body.action !== "toggle-status" && (!name || price === undefined)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existingProduct = await db.product.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Handle different types of updates
    let updateData: any = {};

    if (body.action === "toggle-status") {
      // Toggle inStock status only
      updateData = {
        inStock: !existingProduct.inStock,
      };
    } else {
      // Full product update
      updateData = {
        name,
        price,
        description,
        category,
        image,
        stock_quantity,
        featured,
        ...(inStock !== undefined && { inStock }),
      };
    }

    const updatedProduct = await db.product.update({
      where: {
        id: params.id,
      },
      data: updateData,
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const user = session.user as ExtendedUser;

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const product = await db.product.findUnique({
      where: {
        id: params.id,
      },
      include: {
        cart_items: true,
        order_details: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if product is being used in any active cart items or orders
    const activeCartItems = product.cart_items.length;
    const orderDetails = product.order_details.length;

    if (activeCartItems > 0 || orderDetails > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete product",
          message: `This product cannot be deleted because it is referenced in ${activeCartItems} cart item(s) and ${orderDetails} order(s). Please remove all references first or mark the product as inactive instead.`,
          details: {
            cartItems: activeCartItems,
            orders: orderDetails,
          },
        },
        { status: 400 }
      );
    }

    // Use transaction to ensure data consistency
    await db.$transaction(async (prisma) => {
      // Delete the product (cascading deletes will handle related records)
      await prisma.product.delete({
        where: {
          id: params.id,
        },
      });
    });

    return NextResponse.json(
      { message: "Product deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting product:", error);

    // Handle foreign key constraint errors
    if (
      error instanceof Error &&
      error.message.includes("foreign key constraint")
    ) {
      return NextResponse.json(
        {
          error: "Cannot delete product",
          message:
            "This product is referenced by other records and cannot be deleted. Please remove all references first.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
