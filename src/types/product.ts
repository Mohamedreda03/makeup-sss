export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  featured: boolean;
  inStock: boolean;
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
