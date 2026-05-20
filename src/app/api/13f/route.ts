import { PRIORITY_FILLINGS, type PriorityFiling } from '@/constants/13f-priority';
import {
  padCik,
  secFetchJson,
  stripCikFromDisplayName,
} from '@/lib/api/sec-edgar';
import type {
  ThirteenFListItem,
  ThirteenFListResponse,
} from '@/types/thirteenf';
import { unstable_cache } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

const SEARCH_BASE = 'https://efts.sec.gov/LATEST/search-index';
const SEC_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const CACHE_REVALIDATE = 60 * 60;
const PRIORITY_CACHE = 60 * 60 * 6; // submissions은 잘 안 바뀌니까 6시간

type EftsResponse = {
  hits: {
    total: { value: number };
    hits: Array<{
      _source: {
        ciks: string[];
        display_names: string[];
        period_ending: string;
        file_date: string;
        adsh: string;
        form: string;
        biz_locations?: string[];
      };
    }>;
  };
};

async function searchThirteenF(
  entityName: string,
  from: number,
): Promise<EftsResponse> {
  const params = new URLSearchParams({
    forms: '13F-HR',
    from: String(from),
  });
  if (entityName) params.set('entityName', entityName);
  return secFetchJson<EftsResponse>(`${SEARCH_BASE}?${params.toString()}`);
}

const cachedSearch = unstable_cache(searchThirteenF, ['13f-list-v3'], {
  revalidate: CACHE_REVALIDATE,
  tags: ['13f-list'],
});

// submissions JSON에서 가장 최근 13F-HR을 ListItem 형태로 만든다.
type SubmissionsJson = {
  name?: string;
  addresses?: { business?: { city?: string; stateOrCountry?: string } };
  filings: {
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      form: string[];
      primaryDocDescription?: string[];
    };
  };
};

async function fetchPriorityFiling(
  cik: string,
): Promise<ThirteenFListItem | null> {
  const json = await secFetchJson<SubmissionsJson>(
    `https://data.sec.gov/submissions/CIK${cik}.json`,
  );
  const { accessionNumber, filingDate, form } = json.filings.recent;
  const idx = form.findIndex((f) => f === '13F-HR');
  if (idx === -1) return null;

  const business = json.addresses?.business;
  const bizLocation =
    business?.city && business?.stateOrCountry
      ? `${business.city}, ${business.stateOrCountry}`
      : null;

  // periodEnding은 submissions JSON엔 없어서 빈 문자열. UI가 fileDate로 표시해도 충분.
  return {
    accession: accessionNumber[idx],
    cik,
    filerName: json.name ?? '',
    formType: ' 13F-HR',
    fileDate: filingDate[idx],
    periodEnding: '',
    bizLocation,
  };
}

const cachedFetchPriorityFiling = unstable_cache(
  fetchPriorityFiling,
  ['13f-priority-filing-v1'],
  { revalidate: PRIORITY_CACHE, tags: ['13f-priority'] },
);

// PRIORITY_FILLINGS 배열을 order asc + 배열 순서 stable로 정렬한 후 fetch.
async function resolvePriorityItems(): Promise<ThirteenFListItem[]> {
  if (PRIORITY_FILLINGS.length === 0) return [];

  const ordered = PRIORITY_FILLINGS.map((p, originalIndex) => ({
    ...p,
    originalIndex,
  })).sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.originalIndex - b.originalIndex;
  });

  const results = await Promise.all(
    ordered.map(async (p: PriorityFiling & { originalIndex: number }) => {
      try {
        return await cachedFetchPriorityFiling(p.cik);
      } catch (e) {
        console.error('[13f] priority fetch failed for', p.cik, e);
        return null;
      }
    }),
  );
  return results.filter((r): r is ThirteenFListItem => r !== null);
}

function mapHitToItem(
  h: EftsResponse['hits']['hits'][number],
): ThirteenFListItem {
  const cik = h._source.ciks[0] ?? '';
  return {
    accession: h._source.adsh,
    cik: padCik(cik),
    filerName: stripCikFromDisplayName(h._source.display_names[0] ?? ''),
    formType: h._source.form,
    fileDate: h._source.file_date,
    periodEnding: h._source.period_ending,
    bizLocation: h._source.biz_locations?.[0] ?? null,
  };
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const entityName = (sp.get('q') ?? '').trim();
  const page = Math.max(1, Number.parseInt(sp.get('page') ?? '1', 10));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number.parseInt(sp.get('size') ?? `${DEFAULT_PAGE_SIZE}`, 10)),
  );

  // priority는 검색어 없을 때만 의미가 있음. page=1엔 prepend, 그 외 페이지에서는 일반 결과에서 dedup만.
  const usePriority = entityName === '';
  const priorityItems = usePriority ? await resolvePriorityItems() : [];
  const priorityCiks = new Set(priorityItems.map((p) => p.cik));

  // SEC fetch는 100단위. 일반 결과에서 priority 매니저의 같은 CIK는 dedup.
  const globalOffset = (page - 1) * pageSize;
  const secFrom = Math.floor(globalOffset / SEC_PAGE_SIZE) * SEC_PAGE_SIZE;
  const localOffset = globalOffset - secFrom;

  let efts: EftsResponse;
  try {
    efts = await cachedSearch(entityName, secFrom);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'SEC search failed';
    return NextResponse.json({ message }, { status: 502 });
  }

  const fetchedItems = efts.hits.hits
    .map(mapHitToItem)
    .filter((it) => !priorityCiks.has(it.cik));

  // priority 먼저, 그다음 페이지 사이즈에 맞게 일반 항목 채움
  const merged =
    page === 1 ? [...priorityItems, ...fetchedItems] : fetchedItems;
  const items = merged.slice(localOffset, localOffset + pageSize);

  const response: ThirteenFListResponse = {
    items,
    total: efts.hits.total.value + (page === 1 ? priorityItems.length : 0),
    page,
    pageSize,
  };
  return NextResponse.json(response);
}
