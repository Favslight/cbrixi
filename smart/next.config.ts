import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Prevent Next.js from tracing files outside this project root.
  // Without this, the parent cbrixi/ package.json confuses CSS module resolution.
  outputFileTracingRoot: path.join(__dirname),

  // Turbopack config (Next.js 16+ uses Turbopack by default)
  // Explicitly map 'tailwindcss' to the local installation so the parent
  // backend package.json doesn't intercept the resolution.
  turbopack: {
    resolveAlias: {
      tailwindcss: path.resolve(__dirname, "node_modules/tailwindcss"),
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
