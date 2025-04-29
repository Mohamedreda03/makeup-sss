import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    // Parse query parameters with defaults
    const rawPage = parseInt(url.searchParams.get("page") || "1");
    const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

    const rawLimit = parseInt(url.searchParams.get("limit") || "6");
    const limit =
      isNaN(rawLimit) || rawLimit < 1 || rawLimit > 20 ? 6 : rawLimit;

    const query = url.searchParams.get("query") || undefined;
    const sort = url.searchParams.get("sort") || "createdAt:desc";

    console.log(
      `API: Fetching products - page ${page}, limit ${limit}, sort ${sort}`
    );

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Prepare filters
    const filters: any = {};

    // Add search query filter if provided
    if (query) {
      filters.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ];
    }

    // Parse sort parameter (format: field:direction)
    const [sortField, sortDirection] = sort.split(":");
    const orderBy: any = {};

    // Set default sorting if invalid sort field provided
    if (["name", "price", "createdAt", "category"].includes(sortField)) {
      orderBy[sortField] = sortDirection === "asc" ? "asc" : "desc";
    } else {
      orderBy["createdAt"] = "desc"; // default sorting
    }

    // Fetch products with pagination and sorting
    const products = await db.product.findMany({
      where: filters,
      skip,
      take: limit,
      orderBy,
    });

    // Get total count for pagination
    const total = await db.product.count({
      where: filters,
    });

    const totalPages = Math.ceil(total / limit);

    console.log(`API: Found ${total} products, ${totalPages} pages`);

    // Get all distinct categories for filtering
    const categories = await db.product.findMany({
      select: {
        category: true,
      },
      distinct: ["category"],
    });

    const distinctCategories = categories.map(
      (item: (typeof categories)[0]) => item.category
    );

    return NextResponse.json(
      {
        products,
        total,
        totalPages,
        currentPage: page,
        categories: distinctCategories,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
