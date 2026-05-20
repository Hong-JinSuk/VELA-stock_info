/**
 * SEC EDGAR 공식 API helper.
 * - rate limit: 10 req/sec (free tier)
 * - 인증: User-Agent 헤더에 본인 이메일 포함 필수
 *
 * 두 가지 base URL을 사용:
 *  - efts.sec.gov: full-text search (search-index)
 *  - data.sec.gov: submissions JSON
 *  - www.sec.gov/Archives: 실제 filing 문서
 */

const USER_AGENT_EMAIL =
  process.env.ADMIN_EMAIL ?? 'realtone98@gmail.com';
const USER_AGENT = `vela-app ${USER_AGENT_EMAIL}`;

const COMMON_HEADERS: HeadersInit = {
  'User-Agent': USER_AGENT,
  'Accept-Encoding': 'gzip, deflate',
};

export async function secFetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: COMMON_HEADERS });
  if (!res.ok) {
    throw new Error(`[SEC] ${url} → HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function secFetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: COMMON_HEADERS });
  if (!res.ok) {
    throw new Error(`[SEC] ${url} → HTTP ${res.status}`);
  }
  return await res.text();
}

// Accession "0001990467-26-000001" → "000199046726000001" (Archives URL path 용)
export function stripAccessionDashes(accession: string): string {
  return accession.replace(/-/g, '');
}

// CIK를 10자리 padded 문자열로 ("1067983" → "0001067983")
export function padCik(cik: string | number): string {
  return String(cik).padStart(10, '0');
}

// display_names: "Talon Private Wealth, LLC  (CIK 0001990467)" → "Talon Private Wealth, LLC"
export function stripCikFromDisplayName(displayName: string): string {
  return displayName.replace(/\s*\(CIK\s+\d+\)\s*$/, '').trim();
}
