import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Sample product data to seed the database
const sampleProducts = [
  {
    name: "Radiance Foundation",
    description:
      "Lightweight foundation with medium coverage and natural finish.",
    price: 1999.5,
    category: "Makeup",
    imageUrl:
      "https://images.unsplash.com/photo-1599733589046-833caccbbd3c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    featured: true,
    inStock: true,
  },
  {
    name: "Velvet Lipstick Set",
    description: "Set of 3 matte velvet lipsticks in different shades.",
    price: 1749.5,
    category: "Makeup",
    imageUrl:
      "https://images.unsplash.com/photo-1586495777744-4413f21062fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    featured: false,
    inStock: true,
  },
  {
    name: "Hydrating Face Serum",
    description:
      "Intensive hydrating serum with hyaluronic acid for all skin types.",
    price: 2149.5,
    category: "Skincare",
    imageUrl:
      "https://images.unsplash.com/photo-1611930022073-84f149f2a6d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    featured: true,
    inStock: true,
  },
  {
    name: "Natural Glow Highlighter",
    description: "Champagne-colored highlighter for a natural glow effect.",
    price: 1449.5,
    category: "Makeup",
    imageUrl:
      "https://images.unsplash.com/photo-1631214524020-5d523a04a7a8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    featured: false,
    inStock: true,
  },
  {
    name: "Argan Oil Hair Treatment",
    description:
      "Nourishing hair treatment with pure argan oil for damaged hair.",
    price: 1849.5,
    category: "Haircare",
    imageUrl:
      "https://images.unsplash.com/photo-1559599101-f09722fb4948?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    featured: true,
    inStock: true,
  },
  {
    name: "Rosewater Facial Toner",
    description:
      "Refreshing facial toner with pure rosewater to revitalize skin.",
    price: 1149.5,
    category: "Skincare",
    imageUrl:
      "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    featured: false,
    inStock: true,
  },
  {
    name: "Anti-Aging Night Cream",
    description: "Luxurious night cream with retinol for reducing fine lines.",
    price: 2749.5,
    category: "Skincare",
    imageUrl:
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    featured: true,
    inStock: true,
  },
  {
    name: "Volumizing Mascara",
    description: "Long-lasting mascara for dramatic, voluminous lashes.",
    price: 1349.5,
    category: "Makeup",
    imageUrl:
      "https://images.unsplash.com/photo-1591360236480-4ed861025fa1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    featured: false,
    inStock: true,
  },
  {
    name: "Cleansing Facial Oil",
    description: "Gentle cleansing oil that dissolves makeup and impurities.",
    price: 1649.5,
    category: "Skincare",
    imageUrl:
      "https://images.unsplash.com/photo-1601049676869-704cc174563d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    featured: false,
    inStock: true,
  },
  {
    name: "Matte Eyeshadow Palette",
    description: "Professional 12-color eyeshadow palette with matte finish.",
    price: 2149.5,
    category: "Makeup",
    imageUrl:
      "https://images.unsplash.com/photo-1583241119332-31fcce048935?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    featured: true,
    inStock: true,
  },
  {
    name: "Vitamin C Face Cream",
    description: "Brightening face cream with vitamin C for radiant skin.",
    price: 1949.5,
    category: "Skincare",
    imageUrl:
      "https://images.unsplash.com/photo-1609097164673-7cfab9429bef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    featured: false,
    inStock: true,
  },
  {
    name: "Keratin Hair Mask",
    description: "Deep conditioning hair mask with keratin for damaged hair.",
    price: 1499.5,
    category: "Haircare",
    imageUrl:
      "https://images.unsplash.com/photo-1526947425960-945c6e72858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    featured: true,
    inStock: true,
  },
];

export async function GET() {
  try {
    // First check if we already have products
    const existingProducts = await db.product.count();

    console.log(`Seed API: Found ${existingProducts} existing products`);

    if (existingProducts > 0) {
      return NextResponse.json({
        message: `Database already has ${existingProducts} products. Seed skipped.`,
      });
    }

    console.log(`Seed API: Creating ${sampleProducts.length} new products`);

    // Create all products
    try {
      await db.product.createMany({
        data: sampleProducts,
      });

      console.log("Seed API: Products created successfully");

      return NextResponse.json({
        message: `Successfully seeded ${sampleProducts.length} products.`,
      });
    } catch (dbError: any) {
      console.error("Seed API: Database error:", dbError);
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Seed API: Error seeding products:", error);
    return NextResponse.json(
      { error: "Failed to seed products" },
      { status: 500 }
    );
  }
}
