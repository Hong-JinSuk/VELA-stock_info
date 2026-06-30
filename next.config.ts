import type { NextConfig } from 'next';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

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
      // PostHog 리버스 프록시(광고/추적 차단기 우회). 클라 api_host = `${BASE_PATH}/ingest`.
      // static(에셋)은 us-assets, 나머지(capture/flags 등)는 us 호스트로. (US Cloud 기준)
      // static 규칙이 catch-all보다 먼저 와야 함.
      {
        source: `${BASE_PATH}/ingest/static/:path*`,
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: `${BASE_PATH}/ingest/:path*`,
        destination: 'https://us.i.posthog.com/:path*',
      },
      // Fear & Greed 로직
      // 소스는 CNN 공식 API. rewrite로 직접 못 보냄(응답 형태 변환 + anti-bot 헤더 필요)이라,
      // 정규화 라우트 `/api/fear-greed`로 보내고 거기서 CNN을 호출해 `[{date, score}]`로 맞춰 준다.
      {
        // 프론트(useFng) / gemini fngAdapter가 '/api-fng'로 호출.
        source: '/api-fng',
        destination: '/api/fear-greed',
      },
      {
        source: '/vela/api/api-fng',
        destination: '/api/fear-greed',
      },
    ];
  },
};

export default nextConfig;
