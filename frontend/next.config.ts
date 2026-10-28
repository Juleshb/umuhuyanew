import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  fallbacks: {
    document: "/offline",
  },
});

/** Server-only API host for rewrites. Do not expose this as NEXT_PUBLIC_*. */
const BACKEND_ORIGIN =
  process.env.BACKEND_ORIGIN?.replace(/\/$/, "") || "http://188.137.183.73:4001";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost", "172.20.10.3"],
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${BACKEND_ORIGIN}/api/v1/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${BACKEND_ORIGIN}/uploads/:path*`,
      },
    ];
  },
};

export default withPWA(nextConfig);
