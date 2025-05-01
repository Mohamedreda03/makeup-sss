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
      // Safety check for file type
      if (!file.type.includes("image")) {
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
          console.error(
            "Signature response not OK:",
            await signatureResponse.text()
          );
          throw new Error("Failed to get signature for upload");
        }

        const {
          signature,
          timestamp: signatureTimestamp,
          cloudName,
          apiKey,
        } = await signatureResponse.json();

        console.log("Got signature for Cloudinary upload:", {
          folder,
          publicId: uniqueFilename,
          cloudName,
          hasSignature: !!signature,
          hasApiKey: !!apiKey,
        });

        // 2. Create FormData for upload
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", apiKey);
        formData.append("timestamp", signatureTimestamp.toString());
        formData.append("signature", signature);
        formData.append("folder", folder);
        formData.append("public_id", uniqueFilename);

        // 3. Upload to Cloudinary using the signed data
        console.log("Sending upload to Cloudinary...");
        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error("Cloudinary upload failed:", errorText);
          throw new Error(
            `Cloudinary upload failed: ${uploadResponse.statusText}`
          );
        }

        const data = await uploadResponse.json();
        console.log("Cloudinary upload successful, received data:", {
          publicId: data.public_id,
          url: data.secure_url,
          format: data.format,
        });

        // Clean up progress interval
        if (progressIntervalId) {
          clearInterval(progressIntervalId);
          // Jump to 100% when done
          if (onProgress) onProgress(100);
        }

        resolve(data.secure_url);
      } catch (uploadError) {
        // Clean up progress interval if exists
        if (progressIntervalId) {
          clearInterval(progressIntervalId);
        }

        console.error("Error during Cloudinary upload:", uploadError);

        // Use a default placeholder image as fallback
        const fallbackUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/v1/placeholders/profile_placeholder.jpg`;
        console.warn("Using fallback image URL:", fallbackUrl);

        // In production we use a fallback, but in development we should know about the error
        if (process.env.NODE_ENV === "development") {
          reject(uploadError);
          return;
        }

        resolve(fallbackUrl);
      }
    } catch (error) {
      console.error("Unexpected error in uploadImageToCloudinary:", error);

      // Use a default placeholder image as fallback
      const fallbackUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/v1/placeholders/profile_placeholder.jpg`;
      console.warn(
        "Using fallback image URL due to unexpected error:",
        fallbackUrl
      );

      // In production we use a fallback, but in development we should know about the error
      if (process.env.NODE_ENV === "development") {
        reject(error);
        return;
      }

      resolve(fallbackUrl);
    }
  });
}
