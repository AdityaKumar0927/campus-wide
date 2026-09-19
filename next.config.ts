import createMDX from "@next/mdx";
import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security/headers";

const nextConfig: NextConfig = {
  reactCompiler: true,
  pageExtensions: ["ts", "tsx", "mdx"],
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Never let the browser cache API responses by default; routes may override.
        source: "/api/(.*)",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

/** Policy documents are MDX (docs/BRIEF.md §7); the loader runs under Turbopack with no remark plugins. */
const withMDX = createMDX({});

export default withMDX(nextConfig);
