import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Без basePath и assetPrefix для локального тестирования
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
