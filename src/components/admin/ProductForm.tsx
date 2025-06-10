"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Upload, ImagePlus, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Form schema
const productFormSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Product name must be at least 3 characters" })
    .max(100, { message: "Product name must be less than 100 characters" }),
  description: z
    .string()
    .max(1000, { message: "Description must be less than 1000 characters" })
    .optional(),
  price: z
    .string()
    .refine((value) => !isNaN(parseFloat(value)), {
      message: "Price must be a valid number",
    })
    .refine((value) => parseFloat(value) >= 0, {
      message: "Price must be a positive number",
    }),
  image: z.string().optional(),
  category: z.string().optional().default(""),
  stock_quantity: z
    .string()
    .refine((value) => !isNaN(parseInt(value)), {
      message: "Stock quantity must be a valid number",
    })
    .refine((value) => parseInt(value) >= 0, {
      message: "Stock quantity must be a positive number",
    })
    .default("0"),
  featured: z.boolean().default(false),
  inStock: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

// Default form values
const defaultValues: Partial<ProductFormValues> = {
  name: "",
  description: "",
  price: "",
  image: "",
  category: "",
  stock_quantity: "0",
  featured: false,
  inStock: true,
};

interface ProductFormProps {
  initialData?: ProductFormValues;
  productId?: string;
}

export default function ProductForm({
  initialData,
  productId,
}: ProductFormProps = {}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.image || null
  );

  const isEditMode = !!productId;

  // Initialize form with default values
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initialData || defaultValues,
  });

  // Fetch product data when productId is provided
  useEffect(() => {
    const fetchProductData = async () => {
      if (!productId || initialData) return;

      setFetchingData(true);
      try {
        const response = await fetch(`/api/admin/products/${productId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch product data");
        }

        const product = await response.json();
        // Update form with fetched data
        const formData: ProductFormValues = {
          name: product.name || "",
          description: product.description || "",
          price: product.price?.toString() || "",
          image: product.image || "",
          category: product.category || "",
          stock_quantity: product.stock_quantity?.toString() || "0",
          featured: product.featured || false,
          inStock: product.inStock !== undefined ? product.inStock : true,
        };

        // Reset form with new data
        form.reset(formData);

        // Set image preview
        if (product.image) {
          setImagePreview(product.image);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load product data. Please try again.",
        });
      } finally {
        setFetchingData(false);
      }
    };

    fetchProductData();
  }, [productId, initialData, form, toast]);

  // Handle form submission
  const onSubmit = async (data: ProductFormValues) => {
    setLoading(true);
    try {
      const formattedData = {
        ...data,
        price: parseFloat(data.price),
        stock_quantity: parseInt(data.stock_quantity),
      };

      // Send data to the API
      const response = await fetch(
        `/api/admin/products${isEditMode ? `/${productId}` : ""}`,
        {
          method: isEditMode ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formattedData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save product");
      }

      toast({
        title: isEditMode ? "Product updated" : "Product created",
        description: isEditMode
          ? "The product has been updated successfully."
          : "The product has been created successfully.",
      });

      // Redirect to products page
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${
          isEditMode ? "update" : "create"
        } product. Please try again.`,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Image file size must be less than 5MB",
      });
      return;
    }

    // In a real app, you would upload the file to a storage service
    // For this example, we'll just set a local preview using a data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const dataUrl = event.target.result as string;
        setImagePreview(dataUrl);
        form.setValue("image", dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };
  return (
    <>
      {fetchingData && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading product data...</span>
        </div>
      )}

      {!fetchingData && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              {/* Product Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Product Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter product description"
                      className="resize-none min-h-[120px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a detailed description of the product.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />{" "}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Price */}
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Stock Quantity Input */}
              <FormField
                control={form.control}
                name="stock_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Enter stock quantity"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of items available in stock
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category Input */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product category" {...field} />
                    </FormControl>
                    <FormDescription>
                      Product category (e.g., Makeup, Skincare)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Featured Checkbox */}
              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Featured Product</FormLabel>
                      <FormDescription>
                        Show this product on the homepage and in featured
                        sections
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {/* In Stock Checkbox */}
              <FormField
                control={form.control}
                name="inStock"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Available for Purchase</FormLabel>
                      <FormDescription>
                        Allow customers to purchase this product
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            {/* Image Upload */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="imageUpload">Product Image</Label>
                <FormDescription>
                  Upload a product image (max 5MB).
                </FormDescription>
              </div>

              <div className="flex items-center gap-6">
                {/* Image Preview */}
                <div className="border rounded-md w-32 h-32 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900">
                  {imagePreview ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={imagePreview}
                        alt="Product preview"
                        className="object-cover"
                        fill
                      />
                    </div>
                  ) : (
                    <ImagePlus className="h-10 w-10 text-gray-400" />
                  )}
                </div>

                {/* Upload Button */}
                <div>
                  <Label
                    htmlFor="imageUpload"
                    className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Image
                  </Label>
                  <Input
                    id="imageUpload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>
            </div>
            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/products")}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading
                  ? isEditMode
                    ? "Updating..."
                    : "Creating..."
                  : isEditMode
                  ? "Update Product"
                  : "Create Product"}
              </Button>{" "}
            </div>
          </form>
        </Form>
      )}
    </>
  );
}
