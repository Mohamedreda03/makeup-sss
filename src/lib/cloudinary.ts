import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Check for required environment variables
if (
  !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  !process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.warn(
    "Cloudinary configuration warning: Missing environment variables. " +
      "Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, NEXT_PUBLIC_CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET " +
      "in your .env.local file."
  );
}

export default cloudinary;

// Helper function to generate a Cloudinary URL with cache busting
export function getCloudinaryUrl(publicId: string, options: any = {}) {
  // Add timestamp to prevent caching
  const timestamp = new Date().getTime();
  return cloudinary.url(publicId, {
    ...options,
    secure: true,
    version: timestamp,
  });
}
