/** @type {import('next').NextConfig} */
const nextConfig = {
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
  },
};

export default nextConfig;
