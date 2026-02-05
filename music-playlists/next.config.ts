import type { NextConfig } from "next";

// Configuration Next.js — autorise les images externes (covers des chansons)
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
};

export default nextConfig;
