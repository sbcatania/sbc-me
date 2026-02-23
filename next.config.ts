import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/d/:path*",
        destination: "/systems/d/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
