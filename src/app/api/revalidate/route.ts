import { revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

// gemini-server 배치가 DB를 갱신한 직후 호출해 해당 tag의 unstable_cache를 즉시 무효화한다.
// (배치는 DB를 직접 SQL로 쓰므로 Next 캐시가 변경을 모름 → 이 웹훅으로 깨워줌)
// 시크릿(REVALIDATE_SECRET)으로 보호. 허용 tag만 무효화 가능.
const ALLOWED_TAGS = new Set([
  'macro-indicators',
  'overview-insight',
  '13f-detail',
  '13f-comparison',
]);

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-revalidate-secret');
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
  }

  const tag = req.nextUrl.searchParams.get('tag');
  if (!tag || !ALLOWED_TAGS.has(tag)) {
    return NextResponse.json({ message: 'invalid tag' }, { status: 400 });
  }

  // Next 16: Route Handler에서는 revalidateTag(tag, profile) 사용 (updateTag은 Server Action 전용).
  // 'max' = 태그를 stale로 마킹 → 다음 방문부터 stale-while-revalidate로 갱신.
  revalidateTag(tag, 'max');
  return NextResponse.json({ revalidated: true, tag });
}
