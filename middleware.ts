// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. /vela/api 로 들어오는 요청을 감지
  if (pathname.startsWith('/api')) {
    // 실제 서버 내부의 API 주소로 매핑 (필요 시 수정)
    // 보통 Next.js는 /api/... 요청을 자동으로 app/api/... 폴더로 연결합니다.
    return NextResponse.next();
  }
}

// 미들웨어가 실행될 경로 지정
export const config = {
  matcher: ['/api/:path*'],
};
