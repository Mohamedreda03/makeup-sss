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
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  eslint: {
    // تعطيل عملية إيقاف البناء عند وجود أخطاء ESLint
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
