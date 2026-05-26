import { mapCusipsToInfo } from '@/lib/api/openfigi';
import {
  padCik,
  secFetchJson,
  secFetchText,
  stripAccessionDashes,
  stripCikFromDisplayName,
} from '@/lib/api/sec-edgar';
import type {
  ThirteenFDetail,
  ThirteenFHolding,
} from '@/types/thirteenf';
import { XMLParser } from 'fast-xml-parser';
import { unstable_cache } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

const ARCHIVES_BASE = 'https://www.sec.gov/Archives/edgar/data';
// 한 filing의 XML은 immutable이라 사실상 영구 캐시 가능. 안전하게 30일.
const CACHE_REVALIDATE = 60 * 60 * 24 * 30;

type IndexJson = {
  directory: {
    item: Array<{ name: string; type: string; size: string }>;
  };
};

// SEC EDGAR full-text search 단일 hit (accession으로 한 건 조회).
type SearchByAccession = {
  hits: {
    hits: Array<{
      _source: {
        ciks: string[];
        display_names: string[];
        period_ending: string;
        file_date: string;
        adsh: string;
        form: string;
      };
    }>;
  };
};

async function fetchFilingMeta(
  accession: string,
): Promise<SearchByAccession['hits']['hits'][number]['_source'] | null> {
  // accession은 unique하므로 forms 필터 없이 따옴표 검색만으로 정확 매칭.
  // forms 콤마 OR 처리가 SEC 버그라 제거.
  const url = `https://efts.sec.gov/LATEST/search-index?q=%22${encodeURIComponent(
    accession,
  )}%22`;
  const json = await secFetchJson<SearchByAccession>(url);
  return json.hits.hits[0]?._source ?? null;
}

async function fetchInfoTableXml(
  cik: string,
  accession: string,
): Promise<string | null> {
  const accNoDashes = stripAccessionDashes(accession);
  const cikNumeric = String(Number(cik)); // archives 경로는 leading 0 제거된 cik
  const indexUrl = `${ARCHIVES_BASE}/${cikNumeric}/${accNoDashes}/index.json`;
  const index = await secFetchJson<IndexJson>(indexUrl);

  // infoTable XML 후보: .xml 확장자이고 primary_doc이 아닌 것.
  // 13F-NT는 holdings 없는 notice form → null 반환.
  const infoTableFile = index.directory.item.find(
    (it) =>
      it.name.toLowerCase().endsWith('.xml') &&
      !it.name.toLowerCase().startsWith('primary_doc'),
  );
  if (!infoTableFile) return null;

  const xmlUrl = `${ARCHIVES_BASE}/${cikNumeric}/${accNoDashes}/${infoTableFile.name}`;
  return secFetchText(xmlUrl);
}

// fast-xml-parser는 단일 자식 vs 배열 구분이 까다로워서 strict한 옵션 사용.
// removeNSPrefix: 일부 매니저(NPS 등)가 ns1:infoTable처럼 namespace prefix를 쓰므로 제거해서 통일 처리.
const xmlParser = new XMLParser({
  ignoreAttributes: true,
  parseTagValue: false, // cusip 등 leading 0 보존
  trimValues: true,
  removeNSPrefix: true,
  isArray: (name) => name === 'infoTable',
});

type RawInfoTable = {
  nameOfIssuer: string;
  titleOfClass?: string;
  cusip: string;
  value: string;
  shrsOrPrnAmt?: { sshPrnamt?: string; sshPrnamtType?: string };
  putCall?: string;
};

function parseInfoTable(xml: string): ThirteenFHolding[] {
  type Parsed = {
    informationTable?: { infoTable?: RawInfoTable[] };
    [key: string]: unknown;
  };
  const parsed = xmlParser.parse(xml) as Parsed;
  const raw = parsed.informationTable?.infoTable ?? [];
  if (raw.length === 0) return [];

  // SEC는 2023년 10월 개정 이후 value를 dollars 단위로 보고 (이전엔 thousands).
  // 우리는 2024년 이후 filing만 다루므로 그대로 사용.
  const holdings: Omit<ThirteenFHolding, 'weightPercent'>[] = raw.map((row) => ({
    nameOfIssuer: row.nameOfIssuer ?? '',
    titleOfClass: row.titleOfClass ?? '',
    cusip: row.cusip ?? '',
    ticker: null, // loadDetail에서 OpenFIGI로 enrich
    valueUsd: Number(row.value ?? 0),
    shares: Number(row.shrsOrPrnAmt?.sshPrnamt ?? 0),
    sharesType:
      row.shrsOrPrnAmt?.sshPrnamtType === 'PRN' ? 'PRN' : 'SH',
    putCall:
      row.putCall === 'Put' || row.putCall === 'Call' ? row.putCall : null,
  }));

  const total = holdings.reduce((s, h) => s + h.valueUsd, 0);
  return holdings
    .map((h) => ({
      ...h,
      weightPercent: total > 0 ? (h.valueUsd / total) * 100 : 0,
    }))
    .sort((a, b) => b.valueUsd - a.valueUsd);
}

async function loadDetail(accession: string): Promise<ThirteenFDetail | null> {
  const meta = await fetchFilingMeta(accession);
  if (!meta) return null;
  const cik = padCik(meta.ciks[0] ?? '');
  const filerName = stripCikFromDisplayName(meta.display_names[0] ?? '');

  const xml = await fetchInfoTableXml(cik, accession);
  const parsedHoldings = xml ? parseInfoTable(xml) : [];

  // CUSIP 기준으로 ticker + canonical name enrich.
  // 13F filer가 약어로 적은 nameOfIssuer(예: NPS의 "APPLIED MATLS INC")를
  // static map/OpenFIGI의 표준 이름으로 덮어쓴다. 매핑 없으면 SEC raw 이름 유지.
  const infoMap = await mapCusipsToInfo(parsedHoldings.map((h) => h.cusip));
  const holdings: ThirteenFHolding[] = parsedHoldings.map((h) => {
    const info = infoMap.get(h.cusip);
    return {
      ...h,
      ticker: info?.ticker ?? null,
      nameOfIssuer: info?.name ?? h.nameOfIssuer,
    };
  });

  const totalValueUsd = holdings.reduce((s, h) => s + h.valueUsd, 0);
  const top = holdings[0] ?? null;

  return {
    accession,
    cik,
    filerName,
    formType: meta.form,
    fileDate: meta.file_date,
    periodEnding: meta.period_ending,
    totalValueUsd,
    holdingCount: holdings.length,
    topHoldingName: top?.nameOfIssuer ?? null,
    topHoldingWeight: top?.weightPercent ?? null,
    holdings,
  };
}

export const cachedLoadDetail = unstable_cache(loadDetail, ['13f-detail-v10'], {
  revalidate: CACHE_REVALIDATE,
  tags: ['13f-detail'],
});

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ accession: string }> },
) {
  const { accession } = await ctx.params;
  // accession 검증: "0001234567-25-001234" 패턴
  if (!/^\d{10}-\d{2}-\d{6}$/.test(accession)) {
    return NextResponse.json({ message: 'invalid accession' }, { status: 400 });
  }

  try {
    const detail = await cachedLoadDetail(accession);
    if (!detail) {
      console.warn(`[13F_DETAIL] not found accession=${accession}`);
      return NextResponse.json({ message: 'not found' }, { status: 404 });
    }
    console.log(
      `[13F_DETAIL] loaded accession=${accession} cik=${detail.cik} holdings=${detail.holdings.length}`,
    );
    return NextResponse.json(detail);
  } catch (e) {
    console.error(`[13F_DETAIL] failed accession=${accession}:`, e);
    const message = e instanceof Error ? e.message : 'SEC fetch failed';
    return NextResponse.json({ message }, { status: 502 });
  }
}
