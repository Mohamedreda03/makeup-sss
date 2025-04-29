import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Count products
    const count = await db.product.count();

    // Get a sample of products
    const products = await db.product.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get all categories
    const categories = await db.product.findMany({
      select: {
        category: true,
      },
      distinct: ["category"],
    });

    return NextResponse.json({
      message: "Database debug information",
      productCount: count,
      sampleProducts: products,
      categories: categories.map((c: (typeof categories)[0]) => c.category),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      {
        error: `Database error: ${error.message}`,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
