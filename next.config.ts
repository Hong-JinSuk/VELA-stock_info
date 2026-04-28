import type { NextConfig } from 'next';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH;

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  async rewrites() {
    return [
      // 기본 vela api 로직
      {
        source: '/vela/api/:path*',
        destination: '/api/:path*',
      },
      // Fear & Greed 로직
      // {
      //   source: '/api-fng/:path*', // 호출할 주소
      //   destination: 'https://feargreedchart.com/api/:path*', // 실제 외부 주소
      // },
      {
        // 1. 프론트엔드에서 정확히 '/api-fng' 로만 호출할 때
        source: '/api-fng',
        // 2. 외부 서버의 기본 주소 (끝에 슬래시 포함)로 보냄
        // (?action=history 같은 쿼리는 Next.js가 알아서 뒤에 붙여줍니다)
        destination: 'https://feargreedchart.com/api/',
      },
      {
        // 💡 :path* 를 제거하고 정확히 이 경로로 시작할 때 매칭되게 합니다.
        // 쿼리 스트링(?action=...)은 Next.js가 자동으로 뒤에 붙여줍니다.
        source: '/vela/api/api-fng',
        destination: 'https://feargreedchart.com/api/',
      },
    ];
  },
};

export default nextConfig;
