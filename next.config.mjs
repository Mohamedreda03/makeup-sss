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
  },
  experimental: {
    serverComponentsExternalPackages: ["bcrypt", "@prisma/client"],
  },
  middleware: {
    runtime: "nodejs",
  },
};

export default nextConfig;
