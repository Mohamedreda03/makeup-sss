/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
    domains: ["res.cloudinary.com", "placehold.co", "images.unsplash.com"],
  },
  eslint: {
    // تعطيل عملية إيقاف البناء عند وجود أخطاء ESLint
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
