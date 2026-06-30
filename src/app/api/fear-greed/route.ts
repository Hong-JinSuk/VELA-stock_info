import { api } from '@/lib/api/axios';
import { NextResponse } from 'next/server';

// CNN 공식 Fear & Greed 데이터-비주얼 엔드포인트.
const CNN_FNG_URL =
  'https://production.dataviz.cnn.io/index/fearandgreed/graphdata';

// CNN anti-bot 우회용 브라우저 헤더 (없으면 418 "I'm a teapot. You're a bot").
const CNN_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  Origin: 'https://edition.cnn.com',
  Referer: 'https://edition.cnn.com/',
};

type CnnPoint = { x?: number; y?: number };
type CnnResponse = {
  fear_and_greed?: { score?: number; timestamp?: string };
  fear_and_greed_historical?: { data?: CnnPoint[] };
};

// GET /api/fear-greed — CNN 공식 Fear & Greed 지수를 `[{date, score}]`로 정규화해 반환한다.
// 구 feargreedchart.com `?action=history` 응답 형태와 동일하게 맞춰 다운스트림(gemini fngAdapter·useFng)을 무변경 유지.
// 소비처는 항상 history(전체 시계열)를 받아 최신값을 직접 고르므로 action 쿼리는 무시(라우트를 캐시 가능하게).
export async function GET() {
  try {
    const { data } = await api.get<CnnResponse>(CNN_FNG_URL, {
      baseURL: '',
      headers: CNN_HEADERS,
      withCredentials: false,
      timeout: 15000,
    });

    // 날짜별 score 맵으로 dedup (CNN score는 27.17 같은 float → CNN 표기와 동일하게 정수 반올림).
    const byDate = new Map<string, number>();
    for (const p of data?.fear_and_greed_historical?.data ?? []) {
      if (typeof p?.x === 'number' && typeof p?.y === 'number') {
        byDate.set(new Date(p.x).toISOString().slice(0, 10), Math.round(p.y));
      }
    }
    // 현재값을 오늘 날짜의 최신 항목으로 보장 (historical이 intraday 최신값을 누락할 수 있음).
    const current = data?.fear_and_greed;
    if (current && typeof current.score === 'number') {
      const day = new Date(current.timestamp ?? Date.now())
        .toISOString()
        .slice(0, 10);
      byDate.set(day, Math.round(current.score));
    }

    const series = [...byDate.entries()]
      .map(([date, score]) => ({ date, score }))
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

    if (series.length === 0) {
      return NextResponse.json(
        { message: 'Fear & Greed 데이터가 비어 있습니다.' },
        { status: 502 },
      );
    }

    return NextResponse.json(series, {
      headers: {
        // Vercel CDN에서 15분 캐시(+1시간 stale 허용)로 CNN 호출을 최소화.
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600',
      },
    });
  } catch (e) {
    return NextResponse.json(
      {
        message:
          e instanceof Error ? e.message : 'Fear & Greed 요청에 실패했습니다.',
      },
      { status: 502 },
    );
  }
}
