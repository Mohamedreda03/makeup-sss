import cloudinary from "@/lib/cloudinary";

/**
 * Function to upload an image to Cloudinary securely using signed uploads
 * @param file The file to upload
 * @param folder Optional folder path in Cloudinary
 * @param onProgress Optional progress callback
 * @returns Promise that resolves to the Cloudinary image URL
 */
export async function uploadImageToCloudinary(
  file: File,
  folder: string = "profile-images",
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("Starting Cloudinary upload process for file:", file.name);

      // Safety check for file type
      if (!file.type.includes("image")) {
        console.error("Invalid file type:", file.type);
        reject(new Error("Invalid file type. Please upload an image."));
        return;
      }

      // Create a unique filename
      const timestamp = new Date().getTime();
      const uniqueFilename = `${timestamp}_${file.name.replace(
        /[^a-zA-Z0-9.]/g,
        "_"
      )}`;
      const publicId = `${folder}/${uniqueFilename}`;

      // Start tracking progress
      let progressIntervalId: NodeJS.Timeout | null = null;
      if (onProgress) {
        let fakeProgress = 0;
        progressIntervalId = setInterval(() => {
          fakeProgress += 5;
          if (fakeProgress <= 90) {
            onProgress(fakeProgress);
          } else {
            clearInterval(progressIntervalId!);
          }
        }, 200);
      }

      try {
        // 1. Get a signature from our backend
        const signatureResponse = await fetch("/api/cloudinary/signature", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            folder,
            publicId: uniqueFilename,
          }),
        });

        if (!signatureResponse.ok) {
          throw new Error("Failed to get signature for upload");
        }

        const {
          signature,
          timestamp: signatureTimestamp,
          cloudName,
          apiKey,
        } = await signatureResponse.json();

        // 2. Create FormData for upload
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", apiKey);
        formData.append("timestamp", signatureTimestamp.toString());
        formData.append("signature", signature);
        formData.append("folder", folder);
        formData.append("public_id", uniqueFilename);

        // 3. Upload to Cloudinary using the signed data
        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!uploadResponse.ok) {
          throw new Error(
            `Cloudinary upload failed: ${uploadResponse.statusText}`
          );
        }

        const data = await uploadResponse.json();

        // Clean up progress interval
        if (progressIntervalId) {
          clearInterval(progressIntervalId);
          // Jump to 100% when done
          if (onProgress) onProgress(100);
        }

        // Return the secure URL from Cloudinary
        console.log("Upload successful. Cloudinary URL:", data.secure_url);
        resolve(data.secure_url);
      } catch (uploadError) {
        console.error("Error uploading to Cloudinary:", uploadError);

        // Clean up progress interval if exists
        if (progressIntervalId) {
          clearInterval(progressIntervalId);
        }

        // Use a default placeholder image as fallback
        const fallbackUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/v1/placeholders/profile_placeholder.jpg`;
        console.log("Using fallback URL due to upload error:", fallbackUrl);
        resolve(fallbackUrl);
      }
    } catch (error) {
      console.error("Unexpected error in upload process:", error);

      // Use a default placeholder image as fallback
      const fallbackUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/v1/placeholders/profile_placeholder.jpg`;
      console.log("Using fallback URL due to unexpected error:", fallbackUrl);
      resolve(fallbackUrl);
    }
  });
}
