import type { NextConfig } from "next";

const isStaticExport = process.env.NEXT_PUBLIC_USE_STATIC_DATA === 'true' || process.env.NODE_ENV === 'production'
const isLocalStatic = process.env.NEXT_PUBLIC_USE_STATIC_DATA === 'true' && process.env.NODE_ENV !== 'production'

const nextConfig: NextConfig = {
  // Условно включаем статический экспорт
  ...(isStaticExport && {
    output: 'export',
    trailingSlash: true,
    images: {
      unoptimized: true
    },
    // Для локального тестирования не используем basePath и assetPrefix
    ...(isLocalStatic ? {} : {
      basePath: '/cursor-benchmark',
      assetPrefix: '/cursor-benchmark',
    }),
    eslint: {
      ignoreDuringBuilds: true,
    },
  }),
};

export default nextConfig;
