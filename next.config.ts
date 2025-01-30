import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["i.ytimg.com"],
  },
  async rewrites() {
    return [
      {
        source: '/clips/:path*',
        destination: '/public/clips/:path*',
      }
    ]
  }
};

export default nextConfig;
