import type { NextConfig } from 'next';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH;

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  async rewrites() {
    return [
      {
        source: '/vela/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

export default nextConfig;
