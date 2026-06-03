/**
 * CUSIP → { ticker, name } 매핑 (읽기 전용).
 *
 * 사용자 요청 경로(13F detail/comparison)에서는 OpenFIGI를 **직접 호출하지 않는다.**
 * CUSIP→ticker 매핑은 gemini-server 배치가 OpenFIGI(키+throttle+재시도)로 풀어
 * 공유 테이블 CusipTicker에 박제하고, 여기서는 그 캐시를 **읽기만** 한다.
 *  - 캐시된 CUSIP → 티커/이름 표시
 *  - 미캐시 CUSIP → 티커 null (그냥 SEC raw 이름만 노출, 에러 아님). 배치가 다음 사이클에 채움.
 *
 * 이 구조 덕에 JP모건처럼 수천 종목짜리 filing도 요청 경로에서 수백 개를 라이브 매핑하다
 * 타임아웃 나는 일이 없다. (CUSIP은 filer 간 공유라 캐시 커버리지가 누적·수렴)
 */

import prisma from '@/lib/prisma';

export type CusipMapping = { ticker: string | null; name: string | null };

// L1 프로세스 캐시 (서버 lifetime). L2 = DB(CusipTicker).
const cusipCache = new Map<string, CusipMapping>();

// DB(CusipTicker) 조회 → L1에도 적재.
async function loadFromDb(cusips: string[]): Promise<void> {
  if (cusips.length === 0) return;
  try {
    const rows = await prisma.cusipTicker.findMany({
      where: { cusip: { in: cusips } },
      select: { cusip: true, ticker: true, name: true },
    });
    for (const r of rows) cusipCache.set(r.cusip, { ticker: r.ticker, name: r.name });
  } catch (e) {
    console.error('[OpenFIGI] DB cache read failed:', e);
  }
}

/**
 * CUSIP 배열 → CusipMapping 맵 (캐시 읽기 전용).
 * 미캐시 CUSIP은 { ticker: null, name: null }로 채워 반환한다 (호출 측이 SEC raw 이름 fallback).
 */
export async function mapCusipsToInfo(
  cusips: string[],
): Promise<Map<string, CusipMapping>> {
  const unique = Array.from(new Set(cusips.filter((c) => c)));

  // L1 미스만 DB 조회. (OpenFIGI 라이브 호출 없음 — 배치가 채운 캐시만 읽는다.)
  const l1Missing = unique.filter((c) => !cusipCache.has(c));
  await loadFromDb(l1Missing);

  const out = new Map<string, CusipMapping>();
  for (const c of unique) {
    out.set(c, cusipCache.get(c) ?? { ticker: null, name: null });
  }
  return out;
}
