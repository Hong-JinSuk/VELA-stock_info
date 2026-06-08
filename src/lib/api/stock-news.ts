// 종목 뉴스 = Finnhub company-news(영문) + Google News RSS(국내 증권뉴스) 병합.
// 규칙: 같은 소스(예: Yahoo)는 최대 3개, 국내(ko) 뉴스는 최소 2개 보장, 최신순.
// ⚠️ 서버 전용.
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import type { StockNewsItem } from '@/types/stock';
import { getCompanyNews } from '@/lib/api/finnhub';

const MAX_PER_SOURCE = 3;
const MIN_KOREAN = 2;
const MAX_TOTAL = 16;
const NEWS_MAX_AGE_DAYS = 7; // 1주 이상 지난 뉴스는 노출 안 함

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// datetime(ISO)이 유효하고 7일 이내인지.
function isRecent(iso: string, now: number): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return now - t <= NEWS_MAX_AGE_DAYS * 86400_000;
}

const xmlParser = new XMLParser({ ignoreAttributes: false, trimValues: true });

// 회사명에서 법인 접미사(Inc·Corp·Ltd 등)를 떼어 국내 RSS 검색어 품질을 높인다.
// 예: "NVIDIA Corp" → "NVIDIA", "Pagaya Technologies Ltd" → "Pagaya Technologies".
function cleanCompanyName(name: string): string {
  let out = name.trim();
  // 접미사가 둘 이상 붙는 경우(예: "... Inc Class A")가 있어 몇 번 반복.
  for (let i = 0; i < 3; i++) {
    const next = out
      .replace(
        /[,\s]+(Inc|Incorporated|Corp|Corporation|Co|Company|Ltd|Limited|LLC|L\.?P\.?|PLC|N\.?V\.?|S\.?A\.?|AG|Group|Holdings?|Class\s+[A-C])\.?$/i,
        '',
      )
      .trim();
    if (next === out) break;
    out = next;
  }
  return out || name.trim();
}

type GoogleRssItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  description?: string;
  source?: string | { '#text'?: string };
};

// Google News RSS 검색 (한국어/한국 지역). 회사명 기준 국내 증권뉴스.
async function fetchGoogleNews(query: string): Promise<StockNewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
    query,
  )}&hl=ko&gl=KR&ceid=KR:ko`;
  try {
    const { data } = await axios.get<string>(url, {
      responseType: 'text',
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (vela stock news)' },
    });
    const doc = xmlParser.parse(data) as {
      rss?: { channel?: { item?: GoogleRssItem | GoogleRssItem[] } };
    };
    const raw = doc?.rss?.channel?.item;
    const items = Array.isArray(raw) ? raw : raw ? [raw] : [];
    return items.map((it) => {
      const src =
        typeof it.source === 'string'
          ? it.source
          : (it.source?.['#text'] ?? 'Google News');
      // Google RSS title은 보통 "제목 - 매체" 형태 → 매체 부분 제거.
      const title = (it.title ?? '').replace(new RegExp(`\\s*-\\s*${src}$`), '');
      return {
        source: src,
        headline: title,
        summary: '',
        url: it.link ?? '',
        image: null,
        datetime: it.pubDate ? new Date(it.pubDate).toISOString() : '',
        lang: 'ko' as const,
      };
    });
  } catch (e) {
    console.error('[STOCK_NEWS] google rss failed:', e instanceof Error ? e.message : e);
    return [];
  }
}

async function fetchFinnhubNews(symbol: string): Promise<StockNewsItem[]> {
  const to = new Date();
  const from = new Date(to.getTime() - NEWS_MAX_AGE_DAYS * 86400_000);
  try {
    const raw = await getCompanyNews(symbol, ymd(from), ymd(to));
    return raw
      .filter((n) => n.headline && n.url)
      .map((n) => ({
        source: n.source || 'News',
        headline: n.headline,
        summary: n.summary ?? '',
        url: n.url,
        image: n.image || null,
        datetime: new Date(n.datetime * 1000).toISOString(),
        lang: 'en' as const,
      }));
  } catch (e) {
    console.error('[STOCK_NEWS] finnhub news failed:', e instanceof Error ? e.message : e);
    return [];
  }
}

// 소스별 최대 3개로 제한 (입력은 이미 최신순 가정).
function capPerSource(items: StockNewsItem[], cap: number): StockNewsItem[] {
  const count = new Map<string, number>();
  const out: StockNewsItem[] = [];
  for (const it of items) {
    const key = it.source.toLowerCase();
    const c = count.get(key) ?? 0;
    if (c >= cap) continue;
    count.set(key, c + 1);
    out.push(it);
  }
  return out;
}

function byDateDesc(a: StockNewsItem, b: StockNewsItem): number {
  return (b.datetime || '').localeCompare(a.datetime || '');
}

export async function getStockNews(
  symbol: string,
  companyName?: string,
): Promise<StockNewsItem[]> {
  const query = `${cleanCompanyName(companyName || symbol)} 주가`;
  const [enRaw, koRaw] = await Promise.all([
    fetchFinnhubNews(symbol),
    fetchGoogleNews(query),
  ]);

  // 1) 7일 이내만 남기고 최신순 정렬 → 2) 소스당 최대 3개(최신 우선)
  const now = Date.now();
  const recent = [...enRaw, ...koRaw]
    .filter((n) => isRecent(n.datetime, now))
    .sort(byDateDesc);
  const capped = capPerSource(recent, MAX_PER_SOURCE);

  // 국내 뉴스 최소 보장분(최신 2개) — 총량 컷에서 잘리지 않게 우선 포함.
  const koGuaranteed = capped
    .filter((n) => n.lang === 'ko')
    .slice(0, MIN_KOREAN);

  const seen = new Set<string>();
  const merged: StockNewsItem[] = [];
  for (const it of [...koGuaranteed, ...capped]) {
    if (!it.url || seen.has(it.url)) continue;
    seen.add(it.url);
    merged.push(it);
    if (merged.length >= MAX_TOTAL) break;
  }
  // 보장분이 앞으로 강제됐을 수 있으니 최종 최신순으로 다시 정렬.
  return merged.sort(byDateDesc);
}
