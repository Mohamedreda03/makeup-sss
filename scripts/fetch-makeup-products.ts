import fetch from "node-fetch";
import fs from "fs";

async function fetchMakeupProducts() {
  const res = await fetch(
    "https://makeup-api.herokuapp.com/api/v1/products.json"
  );
  const data = (await res.json()) as any[];

  // Filter and map the first 30 products with all required fields
  const filtered = data
    .filter((p: any) => p.name && p.description && p.price && p.image_link)
    .slice(0, 30)
    .map((p: any) => ({
      id: `prod_api_${p.id}`,
      name: p.name,
      description: p.description,
      price: parseFloat(p.price) || 0,
      imageUrl: p.image_link,
      brand: p.brand,
      productType: p.product_type,
    }));

  fs.writeFileSync(
    "makeup-products-seed.json",
    JSON.stringify(filtered, null, 2)
  );
  console.log("Saved 30 products to makeup-products-seed.json");
}

fetchMakeupProducts();
