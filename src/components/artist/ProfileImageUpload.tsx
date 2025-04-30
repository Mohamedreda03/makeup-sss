import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { uploadImageToCloudinary } from "@/lib/utils/cloudinary-upload";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

interface ProfileImageUploadProps {
  userImage?: string | null;
  userName?: string | null;
  onImageUploaded: (imageUrl: string) => Promise<void>;
}

export function ProfileImageUpload({
  userImage,
  userName,
  onImageUploaded,
}: ProfileImageUploadProps) {
  const { toast } = useToast();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);

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
  };

  // Handle profile image upload
  const handleUploadImage = async () => {
    if (!imageFile) return;
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload image to Cloudinary with progress tracking
      const imageUrl = await uploadImageToCloudinary(
        imageFile,
        "artist-profiles",
        (progress) => {
          setUploadProgress(progress);
        }
      );

      if (imageUrl) {
        // Clean up preview URL
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }

        // Notify parent component to update database
        await onImageUploaded(imageUrl);

        // Reset state
        setImageFile(null);
        setPreviewUrl(null);

        toast({
          title: "Success",
          description:
            "Profile image updated successfully. The new image will appear shortly.",
          variant: "success",
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

  const cancelPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setImageFile(null);
    }
  };

  // Default image if needed
  const defaultProfileImage = "/img/default-avatar.png";

  return (
    <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
      <div className="flex flex-col items-center space-y-2">
        <Avatar className="h-24 w-24 border-2 border-primary/20">
          {previewUrl ? (
            <div className="w-full h-full overflow-hidden rounded-full relative">
              <Image
                src={previewUrl}
                alt="Preview"
                fill
                sizes="96px"
                className="object-cover"
                priority
              />
            </div>
          ) : userImage && typeof userImage === "string" ? (
            <div className="w-full h-full overflow-hidden rounded-full relative">
              <Image
                src={userImage}
                alt={userName || "Profile"}
                fill
                sizes="96px"
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <AvatarFallback className="bg-primary/10 text-primary">
              {userName?.charAt(0) || "A"}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex space-x-2 mt-2">
          <label
            htmlFor="profile-image"
            className={cn(
              "flex cursor-pointer items-center gap-1 text-sm text-primary px-2 py-1 rounded-md border border-primary/20 hover:bg-primary/10 transition-colors",
              isUploading && "opacity-50 cursor-not-allowed"
            )}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Change Photo</span>
            <input
              type="file"
              id="profile-image"
              className="hidden"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              disabled={isUploading}
              key={previewUrl ? undefined : "input-key"} // Force rerender when preview is cleared
            />
          </label>
        </div>
      </div>
      <div className="flex-1">
        {previewUrl && (
          <div className="flex flex-col space-y-2">
            <p className="text-sm text-muted-foreground">
              Preview your new profile photo
            </p>

            {isUploading && (
              <div className="space-y-2 mb-2">
                <Progress value={uploadProgress} className="h-2 w-full" />
                <p className="text-xs text-muted-foreground text-center">
                  {uploadProgress < 100
                    ? `Uploading: ${uploadProgress.toFixed(0)}%`
                    : "Processing image..."}
                </p>
              </div>
            )}

            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={handleUploadImage}
                disabled={isUploading}
                className="bg-primary hover:bg-primary/90"
              >
                {isUploading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isUploading ? "Uploading..." : "Save Photo"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={cancelPreview}
                disabled={isUploading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
