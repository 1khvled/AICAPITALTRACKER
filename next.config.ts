import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.sec.gov",
      },
      {
        protocol: "https",
        hostname: "data.sec.gov",
      },
      {
        protocol: "https",
        hostname: "sec.gov",
      },
    ],
  },
  headers: async () => {
    // Only apply restrictive frame headers in production so development overlay & tools are unaffected
    if (process.env.NODE_ENV !== 'production') {
      return [];
    }
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
