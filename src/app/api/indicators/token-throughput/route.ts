import { getTokenThroughput } from '@/lib/indicators/token-throughput';
import { NextResponse } from 'next/server';

// GET /api/indicators/token-throughput — AI 토큰 처리량(OpenRouter) 일별 시계열.
// 서버 캐시(unstable_cache 6h)로 감싸 있어 upstream 호출은 드물다. bounded 시계열이라 그대로 반환.
export async function GET() {
  try {
    const series = await getTokenThroughput();
    return NextResponse.json(series);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'OpenRouter 조회 실패';
    return NextResponse.json({ message }, { status: 502 });
  }
}
