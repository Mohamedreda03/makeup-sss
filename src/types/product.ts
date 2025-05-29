export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  imageUrl: string | null;
  inStock: boolean;
  featured: boolean;
  stock_quantity: number;
  createdAt: Date;
  updatedAt: Date;
  category: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  totalPages: number;
  currentPage: number;
  categories: string[];
}
