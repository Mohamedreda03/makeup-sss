import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAdmin } from "@/lib/utils/auth-utils";

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await checkAdmin();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sort = searchParams.get("sort") || "createdAt:desc";

    // Parse sort parameter
    const [sortField, sortOrder] = sort.split(":");
    const orderBy = {
      [sortField]: sortOrder === "desc" ? "desc" : "asc",
    }; // Build where clause for search
    const where = query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as any } },
            { description: { contains: query, mode: "insensitive" as any } },
            { category: { contains: query, mode: "insensitive" as any } },
          ],
        }
      : {};

    // Get total count
    const total = await db.product.count({ where });

    // Get products with pagination
    const products = await db.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await checkAdmin();

    // If not admin, session check will throw error, but double check here
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || body.price === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    } // Create product
    const newProduct = await db.product.create({
      data: {
        name: body.name,
        description: body.description || "",
        price: body.price,
        category: body.category || "",
        image: body.image || null,
        stock_quantity: body.stock_quantity ?? 0,
        featured: body.featured ?? false,
        inStock: body.inStock ?? true,
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await checkAdmin();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("id");

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // First, delete all cart items containing this product
    const deletedCartItems = await db.cartItem.deleteMany({
      where: { product_id: productId },
    });

    // Then delete the product
    const deletedProduct = await db.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({
      message: "Product deleted successfully",
      product: deletedProduct,
      removedFromCarts: deletedCartItems.count,
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
