"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  EyeOff,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  category: string;
  stock_quantity: number;
  featured: boolean;
  inStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductsTableProps {
  query: string;
  currentPage: number;
  pageSize: number;
  sort: string;
  initialProducts?: Product[];
}

export default function ProductsTable({
  query,
  currentPage,
  pageSize,
  sort,
  initialProducts = [],
}: ProductsTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState(query);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [totalProducts, setTotalProducts] = useState(100); // This would be fetched from API
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);
  // In a real app, we would fetch data from an API
  // For this example, let's use some static data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch actual products from the API
      const response = await fetch(
        `/api/admin/products?query=${searchQuery}&page=${currentPage}&limit=${pageSize}&sort=${sort}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      setProducts(data.products);
      setTotalProducts(data.total);
    } catch (error) {
      console.error("Error fetching products", error);
      toast({
        variant: "destructive",
        title: "Error fetching products",
        description:
          "There was an error loading the products. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, currentPage, pageSize, sort, toast]);

  // Fetch products when component mounts or when search parameters change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle search
  const handleSearch = () => {
    router.push(
      `/admin/products?query=${searchQuery}&page=1&limit=${pageSize}&sort=${sort}`
    );
  };

  // Handle sorting
  const handleSortChange = (value: string) => {
    router.push(
      `/admin/products?query=${searchQuery}&page=${currentPage}&limit=${pageSize}&sort=${value}`
    );
  };
  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);

      // Call the delete API
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 400 && responseData.details) {
          const { cartItems, orders } = responseData.details;
          const message = `Cannot delete this product because it is being used in:\n• ${cartItems} active cart item(s)\n• ${orders} order(s)\n\nPlease remove all references first or mark the product as inactive instead.`;

          toast({
            variant: "destructive",
            title: "Cannot Delete Product",
            description: message,
            duration: 6000,
          });
          return;
        }

        throw new Error(responseData.message || "Failed to delete product");
      }

      // Refresh the data from server to ensure consistency
      await fetchData();

      toast({
        title: "Product deleted",
        description: "The product has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting product", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "There was an error deleting the product. Please try again.";

      toast({
        variant: "destructive",
        title: "Error deleting product",
        description: errorMessage,
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setDeleteId(null);
    }
  };

  // Handle toggle product status (inStock)
  const handleToggleStatus = async (id: string) => {
    try {
      setTogglingStatus(id);

      const response = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "toggle-status",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle product status");
      }

      const updatedProduct = await response.json();

      // Update the local state
      setProducts((prev) =>
        prev.map((product) =>
          product.id === id
            ? { ...product, inStock: updatedProduct.inStock }
            : product
        )
      );

      toast({
        title: "Status updated",
        description: `Product has been ${
          updatedProduct.inStock ? "activated" : "deactivated"
        } successfully.`,
      });
    } catch (error) {
      console.error("Error toggling product status", error);
      toast({
        variant: "destructive",
        title: "Error updating status",
        description:
          "There was an error updating the product status. Please try again.",
      });
    } finally {
      setTogglingStatus(null);
    }
  };

  // Calculate pagination values
  const totalPages = Math.ceil(totalProducts / pageSize);

  // Handle page change
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      router.push(
        `/admin/products?query=${searchQuery}&page=${
          currentPage - 1
        }&limit=${pageSize}&sort=${sort}`
      );
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      router.push(
        `/admin/products?query=${searchQuery}&page=${
          currentPage + 1
        }&limit=${pageSize}&sort=${sort}`
      );
    }
  };

  return (
    <div>
      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10"
          />
        </div>
        <div className="flex gap-3">
          <Select value={sort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name:asc">Name: A-Z</SelectItem>
              <SelectItem value="name:desc">Name: Z-A</SelectItem>
              <SelectItem value="price:asc">Price: Low to High</SelectItem>
              <SelectItem value="price:desc">Price: High to Low</SelectItem>
              <SelectItem value="stock_quantity:desc">
                Stock: High to Low
              </SelectItem>
              <SelectItem value="stock_quantity:asc">
                Stock: Low to High
              </SelectItem>
              <SelectItem value="createdAt:desc">Newest First</SelectItem>
              <SelectItem value="createdAt:asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-gray-800">
            <TableRow className="border-b border-gray-200 dark:border-gray-700">
              {" "}
              <TableHead className="py-4 px-6 font-semibold text-gray-900 dark:text-gray-100">
                Product
              </TableHead>
              <TableHead className="py-4 px-6 font-semibold text-gray-900 dark:text-gray-100">
                Price
              </TableHead>
              <TableHead className="py-4 px-6 font-semibold text-gray-900 dark:text-gray-100">
                Stock
              </TableHead>
              <TableHead className="py-4 px-6 font-semibold text-gray-900 dark:text-gray-100">
                Status
              </TableHead>
              <TableHead className="py-4 px-6 text-center font-semibold text-gray-900 dark:text-gray-100">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {" "}
            {products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-gray-500 dark:text-gray-400"
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-4xl mb-2">📦</div>
                    <div className="text-lg font-medium mb-1">
                      {loading ? "Loading products..." : "No products found"}
                    </div>
                    {!loading && (
                      <div className="text-sm">
                        Try changing your search criteria or add a new product.
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow
                  key={product.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500">
                            <span className="text-xs font-medium">IMG</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight">
                          {product.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-[200px]">
                          {product.description || "No description"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      EGP {product.price.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    {product.stock_quantity > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        {product.stock_quantity} in stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                        Out of Stock
                      </span>
                    )}
                  </TableCell>{" "}
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      {product.featured && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                          ⭐ Featured
                        </span>
                      )}
                      {!product.featured && (
                        <span className="text-gray-400 dark:text-gray-500 text-xs">
                          Regular
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(product.id)}
                        disabled={togglingStatus === product.id}
                        className={`h-8 px-3 text-xs font-medium transition-all duration-200 ${
                          product.inStock
                            ? "text-green-700 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-900/20 dark:hover:bg-green-900/30"
                            : "text-red-700 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/30"
                        }`}
                      >
                        {togglingStatus === product.id ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : product.inStock ? (
                          <ToggleRight className="h-3 w-3 mr-1" />
                        ) : (
                          <ToggleLeft className="h-3 w-3 mr-1" />
                        )}
                        {product.inStock ? "Active" : "Inactive"}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        asChild
                      >
                        <Link href={`/admin/products/${product.id}`}>
                          <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="sr-only">View</span>
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-green-50 dark:hover:bg-green-900/20"
                        asChild
                      >
                        <Link href={`/admin/products/${product.id}/edit`}>
                          <Pencil className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>{" "}
                      <Dialog
                        open={showDeleteDialog && deleteId === product.id}
                        onOpenChange={(open) => {
                          setShowDeleteDialog(open);
                          if (!open) setDeleteId(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => {
                              setDeleteId(product.id);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Confirm Deletion</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete the product "
                              {product.name}"? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>{" "}
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowDeleteDialog(false);
                                setDeleteId(null);
                              }}
                              disabled={isDeleting}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleDelete(product.id)}
                              disabled={isDeleting}
                              className="min-w-[80px]"
                            >
                              {isDeleting ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                "Delete"
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-500">
          Showing {(currentPage - 1) * pageSize + 1} to{" "}
          {Math.min(currentPage * pageSize, totalProducts)} of {totalProducts}{" "}
          products
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
