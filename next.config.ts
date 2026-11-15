import type { NextConfig } from "next";

// Built as static files and served by Cloudflare Workers (moved from Vercel in
// Nov 2026). The old /d/* redirect lives in public/_redirects, and src/worker.ts
// serves the diagram placeholder page for /systems/d/<id>.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
};

export default nextConfig;
