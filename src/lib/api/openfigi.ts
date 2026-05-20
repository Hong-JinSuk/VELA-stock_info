/**
 * CUSIP → { ticker, name } 매핑. 단일 소스: OpenFIGI.
 *
 * OpenFIGI는 Bloomberg가 공개한 무료 매핑 API로 미국 상장 종목을 거의 100% 커버한다.
 * 무료 한도: 25 req/min, 100 ids/batch. 13F 하나 파싱하면 1~5번 batch 호출이라 여유 있음.
 *
 * 응답 name은 대문자(예: "APPLE INC")라 우리 쪽에서 title-case로 정규화한다.
 * 결과는 module-scope Map에 캐시 (서버 lifetime). filing 단위 unstable_cache가
 * 24h~30day로 detail/comparison 결과를 또 한 번 감싸므로, 실제 OpenFIGI 호출은
 * 새 filing이 cold-load될 때만 발생.
 */

const OPENFIGI_URL = 'https://api.openfigi.com/v3/mapping';
// 무인증: batch당 10개, 25 req/min. API key 발급하면 100개, 250 req/min로 확장 가능.
// 200 holdings filing 기준 20 batch → ~4초 소요. 향후 OPENFIGI_API_KEY env 추가 고려.
const BATCH_SIZE = 10;

export type CusipMapping = { ticker: string | null; name: string | null };

type FigiResult = {
  ticker?: string;
  name?: string;
  exchCode?: string;
  marketSector?: string;
  securityType?: string;
};
type FigiMappingResult = { data?: FigiResult[] } | { warning: string };

const cusipCache = new Map<string, CusipMapping>();

// "APPLE INC" → "Apple Inc". OpenFIGI는 이름을 ALL CAPS로 주는 경우가 많아
// 화면 표시용으로 title-case 변환. 단순 단어 단위 첫 글자 대문자라 완벽하지는 않지만
// (예: "Jpmorgan"이 되는 케이스) raw 대문자보다는 훨씬 보기 좋음.
function toTitleCase(s: string): string {
  return s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

async function fetchBatch(
  cusips: string[],
): Promise<Map<string, CusipMapping> | null> {
  const body = cusips.map((cusip) => ({
    idType: 'ID_CUSIP',
    idValue: cusip,
    exchCode: 'US',
  }));

  try {
    const res = await fetch(OPENFIGI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error(`[OpenFIGI] HTTP ${res.status}`);
      return null;
    }
    const json = (await res.json()) as FigiMappingResult[];
    const result = new Map<string, CusipMapping>();
    for (let i = 0; i < cusips.length; i++) {
      const r = json[i];
      const cusip = cusips[i];
      if (r && 'data' in r && r.data?.[0]) {
        result.set(cusip, {
          ticker: r.data[0].ticker ?? null,
          name: r.data[0].name ? toTitleCase(r.data[0].name) : null,
        });
      } else {
        result.set(cusip, { ticker: null, name: null });
      }
    }
    return result;
  } catch (e) {
    console.error('[OpenFIGI] fetch failed:', e);
    return null;
  }
}

export async function mapCusipsToInfo(
  cusips: string[],
): Promise<Map<string, CusipMapping>> {
  const unique = Array.from(new Set(cusips.filter((c) => c)));
  const missing = unique.filter((c) => !cusipCache.has(c));

  for (let i = 0; i < missing.length; i += BATCH_SIZE) {
    const chunk = missing.slice(i, i + BATCH_SIZE);
    const partial = await fetchBatch(chunk);
    if (partial) {
      for (const [k, v] of partial) cusipCache.set(k, v);
    }
  }

  const out = new Map<string, CusipMapping>();
  for (const c of unique) {
    out.set(c, cusipCache.get(c) ?? { ticker: null, name: null });
  }
  return out;
}
