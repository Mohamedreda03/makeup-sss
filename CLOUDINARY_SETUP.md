# Setting Up Cloudinary for Image Uploads

This guide will help you set up Cloudinary for image uploads in your Next.js application.

## 1. Create a Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com/) and sign up for a free account.
2. After signing up, you'll be taken to your dashboard where you can find your account details.

## 2. Get Your Cloudinary Credentials

From your Cloudinary dashboard, copy the following information:

- **Cloud Name**: Found under "Account Details"
- **API Key**: Found under "Account Details"
- **API Secret**: Found under "Account Details"

## 3. Configure Your Environment Variables

Create a `.env.local` file in the root of your project and add the following variables:

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Replace `your_cloud_name`, `your_api_key`, and `your_api_secret` with the values from your Cloudinary dashboard.

## 4. Set Up Upload Preset (Optional)

If you want to use unsigned uploads (not recommended for production):

1. Go to your Cloudinary dashboard.
2. Navigate to "Settings" > "Upload" > "Upload presets".
3. Click "Add upload preset".
4. Set "Signing Mode" to "Unsigned".
5. Set "Folder" to where you want your images to be stored (e.g., "profile-images").
6. Save the preset and note the name.
7. Add it to your `.env.local` file:

```
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset_name
```

## 5. Create Placeholder Images (Recommended)

For better user experience, upload a placeholder image to your Cloudinary account:

1. In your Cloudinary Media Library, create a folder called "placeholders".
2. Upload a profile placeholder image named "profile_placeholder.jpg".
3. This will be used as a fallback when image uploads fail.

## 6. Cloudinary Transformations

This implementation uses Cloudinary's image transformations:

- `c_fill`: Crops the image to fill the requested dimensions
- `g_face`: Focus on faces in the image (for profile pictures)
- `q_auto`: Automatic quality optimization
- `f_auto`: Automatic format selection based on browser support

These transformations are applied in the UserAvatar component and help optimize image loading and appearance.

## 7. Signed vs. Unsigned Uploads

This implementation uses signed uploads for security. The process works as follows:

1. The frontend requests a signature from the server.
2. The server generates a signature using the API secret (which is never exposed to the client).
3. The frontend uses this signature to upload directly to Cloudinary.

This approach is more secure than unsigned uploads and prevents unauthorized uploads to your Cloudinary account.
