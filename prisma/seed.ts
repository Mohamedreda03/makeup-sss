import { PrismaClient } from "../src/generated/prisma";
import { hash } from "bcrypt";
// import products from "../makeup-products-seed.json";
const products = require("../makeup-products-seed.json");

const prisma = new PrismaClient();

const makeupImages = [
  "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bWFrZXVwfGVufDB8fDB8fHww",
  "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8bWFrZXVwfGVufDB8fDB8fHww",
  "https://images.unsplash.com/photo-1526045478516-99145907023c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fG1ha2V1cHxlbnwwfHwwfHx8MA%3D%3D",
];

async function main() {
  try {
    // Create a test user
    const hashedPassword = await hash("password123", 10);

    const user = await prisma.user.upsert({
      where: { email: "test@example.com" },
      update: {},
      create: {
        email: "test@example.com",
        name: "Test User",
        password: hashedPassword,
        role: "CUSTOMER",
      },
    });

    console.log(`Created user: ${user.email}`);

    // Seed products from makeup-products-seed.json
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      await prisma.product.upsert({
        where: { id: product.id },
        update: {
          name: product.name,
          description: product.description,
          price: product.price,
          imageUrl: makeupImages[i % makeupImages.length],
        },
        create: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          imageUrl: makeupImages[i % makeupImages.length],
          featured: false,
          category: "",
        },
      });
    }
    console.log(`Seeded ${products.length} products from Makeup API`);
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
