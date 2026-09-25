import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, must-revalidate",
          },
        ],
      },
    ];
  },
  images: {
    qualities: [70, 75, 80],
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "tripzido-django.onrender.com",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "tripzido-django.onrender.com",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "159.89.173.1",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "tile.openstreetmap.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "maps.googleapis.com",
        pathname: "/maps/api/staticmap/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
