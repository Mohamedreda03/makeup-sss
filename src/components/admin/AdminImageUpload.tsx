import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { uploadImageToCloudinary } from "@/lib/utils/cloudinary-upload";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

interface AdminImageUploadProps {
  currentImage?: string | null;
  name?: string | null;
  onImageUploaded: (imageUrl: string) => void;
  folder?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function AdminImageUpload({
  currentImage,
  name,
  onImageUploaded,
  folder = "admin-uploads",
  className,
  size = "md",
}: AdminImageUploadProps) {
  const { toast } = useToast();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Determine avatar size based on the size prop
  const avatarSizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
  };

  // Handle image change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or WebP image",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);

    // Create a temporary preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Auto-upload when file is selected
    handleUploadImage(file);
  };

  // Handle image upload
  const handleUploadImage = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);

    try {
      console.log("Starting image upload to Cloudinary...");

      // Upload image to Cloudinary with progress tracking
      const imageUrl = await uploadImageToCloudinary(
        file,
        folder,
        (progress) => {
          setUploadProgress(progress);
          console.log(`Upload progress: ${progress.toFixed(0)}%`);
        }
      );

      if (imageUrl) {
        console.log("Image uploaded successfully, URL:", imageUrl);

        // Clean up preview URL
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          // Update the preview with the actual cloudinary URL
          setPreviewUrl(imageUrl);
        }

        // Notify parent component about the new image URL
        onImageUploaded(imageUrl);
        console.log("Image URL passed to parent component");

        // Reset state but keep preview
        setImageFile(null);

        toast({
          title: "Success",
          description: "Image uploaded successfully",
          
        });
      } else {
        console.error("Image upload failed: No URL returned");
        toast({
          title: "Upload Error",
          description: "Failed to get image URL from server",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload Error",
        description:
          "An error occurred while uploading your image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={cn("flex flex-col items-center space-y-2", className)}>
      <Avatar
        className={cn("border-2 border-primary/20", avatarSizeClasses[size])}
      >
        {previewUrl ? (
          <div className="w-full h-full overflow-hidden rounded-full relative">
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              sizes={size === "sm" ? "64px" : size === "md" ? "96px" : "128px"}
              className="object-cover"
              priority
            />
          </div>
        ) : currentImage ? (
          <div className="w-full h-full overflow-hidden rounded-full relative">
            <Image
              src={currentImage}
              alt={name || "Image"}
              fill
              sizes={size === "sm" ? "64px" : size === "md" ? "96px" : "128px"}
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <AvatarFallback className="bg-primary/10 text-primary">
            {name?.charAt(0) || "A"}
          </AvatarFallback>
        )}
      </Avatar>

      {isUploading && (
        <div className="w-full max-w-[200px] space-y-1">
          <Progress value={uploadProgress} className="h-2 w-full" />
          <p className="text-xs text-muted-foreground text-center">
            {uploadProgress < 100
              ? `Uploading: ${uploadProgress.toFixed(0)}%`
              : "Processing..."}
          </p>
        </div>
      )}

      <label
        htmlFor="admin-image-upload"
        className={cn(
          "flex cursor-pointer items-center gap-1 text-sm text-primary px-2 py-1 rounded-md border border-primary/20 hover:bg-primary/10 transition-colors",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
      >
        <Upload className="h-3.5 w-3.5" />
        <span>{currentImage ? "Change Image" : "Upload Image"}</span>
        <input
          type="file"
          id="admin-image-upload"
          className="hidden"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageChange}
          disabled={isUploading}
          key={isUploading ? "uploading" : "ready"} // Force rerender when upload state changes
        />
      </label>
    </div>
  );
}
