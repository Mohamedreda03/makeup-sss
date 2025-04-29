import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAdmin } from "@/lib/utils/auth-utils";

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
    }

    // Create product
    const newProduct = await db.product.create({
      data: {
        name: body.name,
        description: body.description || "",
        price: body.price,
        category: body.category || "",
        imageUrl: body.imageUrl || null,
        inStock: body.inStock ?? true,
        featured: body.featured ?? false,
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
