@AGENTS.md

# VELA

개인 프로젝트 VELA의 Claude Code 설정 파일입니다.

## 콘텐츠 정책 — ⚠️ CRITICAL (크립토 절대 미제공)

**이 서비스는 코인/크립토(암호화폐·블록체인·스테이블코인·NFT·채굴 등) 관련 정보를 절대 제공하지 않는다.** 종목 추천·섹터·지표·데이터 소스 어디에도 크립토 관련 자산이나 종목(예: 비트코인, COIN, MSTR, MARA/RIOT 등 채굴주, 스테이블코인 발행사 등)을 포함하지 말 것.

- 사용자가 명시적으로 요청하지 않는 한 크립토 관련 기능/종목/데이터를 **먼저 제안하지 말 것.**
- ⚠️ 혹시라도 Claude가 크립토 관련 내용을 제공/추가하자는 의견을 내게 되면, 진행 전에 **반드시 사용자에게 "정말로 크립토 관련 내용을 넣을 것인지" 다시 확인**할 것. (사용자가 이 정책을 명시적으로 세웠음.)

## Overview & Stack

- **Purpose**: 개인화된 주가예측 서비스
- **Web**: Next.js (App Router) + TypeScript (strict) + Tailwind CSS v4 · base path `/vela` (`NEXT_PUBLIC_BASE_PATH`) · 패키지 매니저 `yarn`
- **DB**: Supabase (PostgreSQL) + Prisma ORM — 스키마는 `prisma/schema/` 분할 관리, 클라이언트 생성물은 `src/generated/`에 커밋됨
- **Auth**: NextAuth (Google OAuth + Credentials)
- **AI Server**: 별도 레포 `gemini-server`. **프로덕션 배포 대상은 Supabase Edge Functions** (Render는 더 이상 사용하지 않음 — 관련 코드/URL 모두 제거됨). 로컬 개발만 Express(`localhost:3001`).
  - Endpoint base: `NEXT_PUBLIC_GEMINI_SERVER` — 로컬 `http://localhost:3001/ai`, 프로덕션 `https://<project-ref>.supabase.co/functions/v1`
  - ⚠️ **새 Edge Function 추가 시 2가지 필수**: ① `supabase functions deploy <name>`로 실제 배포, ② cron(pg_cron)이 **무인증** `net.http_post`로 호출하므로 `supabase/config.toml`에 `[functions.<name>] verify_jwt = false`를 추가(없으면 배포돼도 cron이 **401/404로 조용히 실패**). cron은 fire-and-forget이라 함수가 죽어도 `cron.job_run_details`엔 `succeeded`로 찍히니, 실패 진단은 `net._http_response`의 `status_code`로 확인할 것.
- **Cron**: Supabase `pg_cron` + `pg_net`으로 Edge Function 호출 (예: `overview-snapshot` 08:00 KST)
- **State**: 서버 상태 TanStack Query (`staleTime` 명시) · 클라 상태 jotai (`src/store/`) · Form react-hook-form + zod (`src/schemas/`)

## Commands

```bash
yarn run dev                  # 로컬 env 사용 (.env.local)
yarn run build                # prisma generate + migrate deploy + next build
yarn run lint                 # ESLint 검사
yarn run migrate:dev <이름>   # prisma migrate dev (개발용, Supabase에 신규 마이그레이션 생성/적용)
npx prisma generate           # Prisma 클라이언트 재생성 (스키마 변경 후 필수)
```

> 작업 후 반드시 `lint`를 실행해 오류가 없는지 확인할 것.

## Project Structure

```
prisma/
└── schema/        # Prisma 스키마 (분할 관리)

src/
├── app/           # Next.js App Router 페이지 / API route
├── components/    # 재사용 컴포넌트
├── constants/     # 매직 넘버, 문자열 상수 관리
├── generated/     # Prisma client 생성물 (커밋됨)
├── hooks/         # 커스텀 훅
├── lib/           # 유틸리티 / 헬퍼 (api, prisma, services 등)
├── motion/        # motion/react
├── schemas/       # react-hook-form 관련 zod
├── store/         # jotai / atom 관리
└── types/         # 공유 TypeScript 타입
```

## DB / Prisma Workflow — ⚠️ CRITICAL

**`prisma/schema/*.prisma`를 수정한 뒤에는 반드시 아래 순서를 안내할 것.** 클라이언트만 재생성 안 하면 dev 서버는 옛 스키마로 쿼리해서 `Unknown argument 'xxx'` 같은 런타임 에러가 난다.

1. `yarn run migrate:dev <마이그레이션_이름>` — DB에 마이그레이션 적용
2. `npx prisma generate` — `src/generated/prisma` 클라이언트 재생성 (migrate:dev가 자동 실행하긴 하지만 dev 서버가 캐시된 모듈을 잡고 있을 수 있으므로 명시적으로 확인)
3. dev 서버 재시작 (`Ctrl+C` → `yarn run dev`) — Next.js HMR이 생성물을 못 잡는 경우가 있음. 필요하면 `rm -rf .next`도 같이.

- 스키마 수정만 하고 migrate는 미루는 경우라도 **클라이언트 재생성과 dev 서버 재시작은 항상 안내할 것.**
- 빌드 시 migrate는 `MIGRATE_MODE=true` 환경변수로 `DIRECT_URL` 사용 (pgbouncer는 DDL 지원 안 함).

## 시간대 (Timezone) — ⚠️ CRITICAL

**DB에 저장하는 모든 timestamp는 KST(UTC+9) 벽시계 기준으로 저장한다.** 사용자가 DB를 직접 조회했을 때(Supabase 콘솔 등) 별도 변환 없이 KST로 보이는 것이 기준이다.

- timestamp 컬럼은 tz 없는 `timestamp`(Prisma `DateTime` → `TIMESTAMP(3)`)를 쓰되, **넣는 값 자체를 KST 벽시계로 박아 넣는다.** (instant를 UTC로 저장하지 말 것 — 그러면 DB에서 9시간 어긋나 보인다.)
- **SQL에서 생성**: `NOW()` 대신 `(NOW() AT TIME ZONE 'Asia/Seoul')` 사용 (KST 벽시계를 tz 없는 timestamp로 반환). Prisma `@default(now())`는 UTC라 KST가 필요한 컬럼은 raw/마이그레이션으로 default를 바꾸거나 앱에서 명시적으로 KST 값을 넣을 것.
- **앱 코드(JS/TS)에서 생성**: `new Date()`(UTC instant)를 그대로 넣지 말고 KST 문자열로 변환해서 넣는다.
  - 날짜 키: `getKstDateKey()` (`new Date(Date.now() + 9h).toISOString().slice(0,10)`).
  - timestamp: `new Date(d.getTime() + 9*60*60*1000).toISOString().replace('T',' ').replace('Z','')` → `"YYYY-MM-DD HH:mm:ss.SSS"`. 레퍼런스 구현은 gemini-server `batch-log.ts`의 `toKstTimestamp`.
- `durationMs`처럼 **기간(diff) 계산은 tz와 무관**하므로 실제 instant(`Date.getTime()`)로 계산할 것. 변환은 컬럼에 넣는 값에만 적용.
- ⚠️ 알려진 잔여 이슈: 일부 테이블의 `createdAt @default(now())`/`CURRENT_TIMESTAMP`는 아직 DB default가 UTC다. 새 timestamp를 추가하거나 기존 것을 고칠 때 위 규칙으로 맞출 것.

## 테이블 공통 컬럼 (createdAt / updatedAt) — ⚠️ CRITICAL

**모든 Prisma 모델에는 `createdAt`과 `updatedAt`을 둔다.** (생성·수정 시각 추적 — 예외는 순수 N:M 조인 테이블 정도.)

- 두 값 모두 **KST 벽시계**로 저장(위 시간대 규칙). `@default(now())`/`@updatedAt`는 UTC라 쓰지 말고, 앱에서 `kstNow()`(`src/lib/kst.ts`)로 **생성 시 둘 다 주입**, **update할 때마다 `updatedAt: kstNow()`를 갱신**한다. (레퍼런스: `src/app/api/community/**`.)
- **수정 가능한 리소스는 UI에 "마지막 수정" 표시를 한다.** 생성 시 두 값이 같으므로 `updatedAt > createdAt`(여유로 1초 초과)면 수정된 것 → "수정됨 · {상대시각}"을 노출. 상대시각은 `formatRelativeFromKstIso`(`src/lib/kst.ts`). (적용 예: 사용 후기 카드 `review-card.tsx`.)
- 응답 DTO에 `createdAt`·`updatedAt`을 **둘 다 ISO로** 내려, 클라가 수정 여부·시각을 판단할 수 있게 한다.

## API Calls — ⚠️ CRITICAL

- **HTTP 클라이언트**: 모든 API 호출은 `src/lib/api/axios.ts`의 `api` 인스턴스를 사용한다. `fetch`는 사용하지 말 것 (서버/클라이언트 모두).
  - 자체 API 호출(상대 경로): `api.get('/overview/insight')` — `NEXT_PUBLIC_API_PATH` baseURL이 자동 prefix.
  - 외부 API(gemini-server 등) 호출: `api.post(\`${GEMINI_SERVER}/...\`, payload)` 처럼 절대 URL 전달 (axios가 baseURL을 무시함).
  - 긴 응답이 예상되는 호출(Gemini 등)은 `{ timeout: 60000 }` 등으로 timeout을 명시할 것 (기본 10s).
  - 응답 에러는 `error-interceptors`가 `throw new Error(message)` 형태로 정규화하므로, 호출 측은 `error instanceof Error ? error.message : ...` 패턴으로 받을 수 있음.

## API Response 표준 — ⚠️ CRITICAL

표준 정의는 `src/lib/api/pagination.ts`. **페이지네이션하는 목록 GET 응답은 `PaginatedResponse<T>` 형태**를 따른다.

- 형태: `{ items: T[], total: number, page: number, size: number }`.
  - `total`: 조건에 맞는 전체 건수 (현재 페이지가 아니라 총합).
  - **같은 엔드포인트가 전체를 한 번에 반환할 때(전체 모드)는 `page: -1, size: -1`** (`NO_PAGINATION`). 즉 page/size가 -1이면 "자르지 않고 다 준 것".
- **예외**: 자동완성·차트 시계열·고정 세트처럼 작게 capped 되어 **통째로 주는 bounded 목록**은 굳이 envelope를 씌우지 않고 bare array(예: `T[]`)로 둔다. envelope는 "자를 게 있는(페이징 의미가 있는)" 목록에만 쓴다.
- 서버(route.ts):
  - `readPagination(sp)`로 page/size를 읽는다. **page/size가 둘 다 없으면 `null`(= 페이지네이션 안 함 = 전체)**.
  - 응답은 `paginatedResponse(items, total, pagination)` 빌더로 만든다. pagination이 `null`이면 page/size가 자동으로 -1이 된다.
- 클라 훅의 응답 타입도 `PaginatedResponse<T>`로 받는다.
- **쿼리 파라미터 이름은 의미가 드러나게.** 검색어를 무지성 `q`로 두지 말 것 → `searchKey`, `title`, `cik` 등 도메인에 맞는 이름 사용.
- **신규 GET 훅을 만들 땐 페이징 필요 여부를 사용자에게 먼저 물어볼 것.** 묻지 않고 임의로 page/size를 붙이지 말 것.

POST / PATCH / PUT / DELETE:

- 목록이 아니므로 **페이지네이션 메타(total/page/size)를 붙이지 않는다.**
- 영향받은 리소스 자체(또는 `{ id }`)를 반환. 필요하면 `src/lib/api/response.ts`의 `createResponse(message, status, result)` envelope 사용.
- 요청 body는 **zod 스키마(`src/schemas/`)로 검증**하고, 클라는 `useMutation`으로 호출.
- 단일 리소스 GET(예: stock detail)은 목록이 아니므로 envelope 없이 리소스를 그대로 반환한다 (`PaginatedResponse` 강제 X).

## AI / Gemini API Workflow — ⚠️ CRITICAL

**Gemini 및 AI 관련 신규 엔드포인트는 반드시 `gemini-server` 프로젝트를 참조해서 작성할 것.** (추가 working directory에 등록되어 있음.)

- 신규 AI 엔드포인트는 **gemini-server에 라우트를 먼저 추가**하고, vela web은 그 엔드포인트를 호출하는 thin wrapper로 작성한다.
- vela web 쪽에서 Gemini 호출(프롬프트 정의, vertex 설정, 응답 파싱)을 중복 작성하지 말 것. 단일 소스는 항상 gemini-server.
- DB 저장이 포함된 배치 로직(예: `runOverviewSnapshot`)은 gemini-server 쪽에서 cron과 manual trigger가 동일 함수를 재사용하도록 설계.
- cron이 죽으면 안 되므로 cron 래퍼는 try/catch로 흡수하되, manual 트리거용 함수는 throw해서 호출 측이 에러를 받을 수 있게 분리.

## Static Fallback Policy — ⚠️ CRITICAL

**사용자가 명시적으로 요청하거나 실제로 다른 방법이 전혀 없는 경우가 아니면, hardcoded static 대안(예: CUSIP→ticker 매핑 테이블, 종목 리스트, 회사명 dictionary 등)을 만들지 말 것.**

- 이유: static 데이터는 (1) 커버리지가 좁고, (2) 손으로 적은 entry는 휴먼 에러(잘못된 CUSIP/매핑 등) 발생, (3) 외부 소스가 바뀌면 stale 됨.
- 우선순위: API/서비스(예: OpenFIGI, SEC EDGAR) > DB 캐시 > static fallback.
- 외부 API가 일시적으로 실패할 수 있다는 우려가 있어도, 그 자체로는 static 대안의 정당화 사유가 아님. 캐시·재시도·에러 핸들링이 우선.
- 정말 static이 필요한 경우(예: API에 없는 도메인 특화 매핑, 사용자 override)는 먼저 사유 설명하고 사용자 확인 후 진행.

## 종목 검색 — ⚠️ 한국어 입력 지원 필수

**종목 검색 자동완성은 영문/티커뿐 아니라 한국어로도 반드시 검색돼야 한다.** (예: "로켓랩"으로 RKLB가 떠야 함.)

- 서버 `/api/stock/search`는 `StockSymbol`(영문 description/symbol)만 ILIKE 매칭하므로 **한글 입력은 매칭되지 않는다.** 한글은 정적 한국어명 맵(`src/constants/stock-korean-names.ts`의 `searchKrTickers`/`TICKER_KR`)으로 매칭한다.
- **새 검색 UI는 `useStockSearch`를 직접 쓰지 말고 공용 훅 `src/lib/services/stock/use-stock-suggestions.ts`(`useStockSuggestions`)를 사용할 것.** 이 훅이 한글이면 정적 맵, 영문이면 서버 검색으로 자동 분기하고 `kr`(한국어명)·`inDirectory`(추가 가능 여부)를 붙여 준다.
- 과거 실수: 섹터 분석 관리 종목검색이 `useStockSearch`를 직접 써서 한국어 검색이 안 됐음 → `useStockSuggestions`로 교체해 해결.

## 검색 자동완성 (드롭다운) 표준 — ⚠️ CRITICAL

**모든 검색 자동완성은 아래 3원칙을 따른다.** 레퍼런스 구현: 13F 검색 (`src/app/(main)/market-data/13f/page.tsx` + `/api/13f/filers` + `/api/13f`). 위 **키보드 네비게이션(`useTypeaheadNav`)** · **한국어 입력 지원**과 함께 검색 UI의 baseline이다.

1. **드롭다운에 뜬 것과 Enter 결과가 어긋나면 안 된다 (매칭 규칙 일치).** 두 형태 공통:
   - **List형(예: 13F)**: 드롭다운 후보는 자동완성 엔드포인트(`/api/13f/filers`), Enter/제출 결과는 리스트 엔드포인트(`/api/13f`)에서 온다. **둘이 서로 다른 컬럼을 매칭하면 "후보는 뜨는데 Enter 결과는 0건".** 예: 드롭다운은 `name`+`krName`+`krNickname` ILIKE인데 리스트는 `name`만 → 한글 Enter가 깨짐. **매칭 컬럼을 바꾸면 두 엔드포인트를 항상 같이 수정.** (과거 실수: 13F 리스트가 영문 name만 매칭해 "버크셔" Enter가 0건 → 양쪽 다 krName/krNickname 매칭.)
   - **Navigate형(예: 종목찾기)**: Enter가 리스트가 아니라 상세로 **이동**한다. 이때 **입력 원문을 그대로 URL로 넘기지 말 것** — 한글이면 `/stocks/엔비디아`처럼 깨진다. 정적 맵 등으로 **해석해 최상단 매칭 대상(티커)으로 이동**해야 한다(디바운스/후보 상태와 무관하게 동기 해석). 레퍼런스: `stock-search-bar.tsx`의 `handleSubmit`이 한글이면 `searchKrTickers(raw)[0]`로 티커 해석 후 이동, 영문이면 `suggestions[0]?.symbol ?? raw`. (과거 실수: 종목찾기가 "엔비디아" Enter를 `/stocks/엔비디아`로 넘겨 깨짐.) 종목 검색 UI는 반드시 공용 훅 `useStockSuggestions`를 쓴다([[종목 검색 한국어 입력 지원]]).

2. **드롭다운은 상한 미리보기 + "더 있음" 안내, 전체는 리스트가 담당.** 드롭다운에 전체 rows를 담지 말 것 (넓은 검색어는 수천 건 — 예: "a"가 8천+). 상한은 **20개**(`SUGGEST_LIMIT`)로 미리보기하고, 초과 여부는 **`limit+1`(21)개를 요청**해 판단한다(`fetched.length > SUGGEST_LIMIT` → `hasMore`). ⚠️ 초과 여부에 **`COUNT` 쿼리를 쓰지 말 것** — `ILIKE '%..%'`는 인덱스를 못 타 넓은 검색어에서 전 매칭 스캔이 되지만, `LIMIT 21`은 21개에서 조기 종료돼 싸다. `hasMore`면 드롭다운 하단에 **"결과가 더 있어요 · Enter로 전체 보기"** 안내를 노출하고, Enter(=폼 제출) 또는 안내 클릭이 리스트 전체 검색을 실행한다.

3. **드롭다운 구조: 스크롤 영역과 푸터(안내)를 분리한다.** 푸터를 스크롤 컨테이너(`<ul>`) 안에 `sticky`로 넣으면 **마지막/포커스 항목을 덮고 스크롤바와 겹쳐 튄다.** 바깥 래퍼(`overflow-hidden rounded-md border`)로 감싸고, 그 안에 스크롤 `<ul>`(`scrollbar-subtle max-h-* overflow-y-auto`, `listRef`는 여기)과 **푸터를 `<ul>`의 형제로 아래에** 둔다 → 푸터가 항목을 안 가리고, 스크롤바는 리스트 영역에만 걸치며 둥근 모서리로 클리핑된다. `useTypeaheadNav`의 `scrollIntoView`도 푸터에 안 가림.

## Error Handling

- API 호출은 hook 안에서 → 오류는 `throw new Error(message)`로 던질 것
- `src/lib/api/error-interceptors.ts`가 받아서:
  - 메시지가 있으면 그대로 toast로 표시
  - 없으면 status code → `STATUS_MESSAGES` 매핑 fallback
  - 그것도 없으면 `FALLBACK_ERROR_MESSAGE` 표시
- 특정 mutation에서 글로벌 toast를 끄려면 `meta: { ignoreGlobalError: true }`

## UI Rules — ⚠️ CRITICAL

### 스타일 변경 금지 원칙

**스타일 변경이 명시적으로 요청되지 않은 경우, 기존 반응형 레이아웃과 Tailwind 클래스를 절대 변경하지 말 것.**

- 기능 추가 또는 로직 변경 시 기존 `sm:`, `md:`, `lg:` 브레이크포인트 클래스를 그대로 유지.
- 레이아웃을 건드려야 할 경우 먼저 확인 후 진행할 것.

### Mobile-first — 모바일 검증 필수

- **UI(컴포넌트/페이지)를 추가하거나 수정하면 모바일 폭(< 640px) 검증은 필수.** 데스크톱만 확인하고 끝내지 말 것. 작업 완료 보고 시 "모바일 폭에서 확인함"을 명시할 것.
- 새 컴포넌트는 처음부터 `grid-cols-1`/`flex-col` 기본 + `sm:`·`lg:`로 확장하는 mobile-first로 작성. 기존 컴포넌트의 반응형 패턴을 참고해 일관성 유지.
- 좁은 폭에서 깨지기 쉬운 곳을 항상 점검: 가로 배치(`justify-between`) 카드, 버튼 토글 그룹, 제목+칩 한 줄, 긴 라벨 → 필요하면 `flex-wrap`·`break-keep`·세로 스택(`flex-col sm:flex-row`)으로 처리.
- **밀집 표(여러 열)는 모바일에서 가로 스크롤로 방치하지 말고 카드로 전환**한다. 공용 DataTable은 `mobileCard`로 자동 지원(→ "DataTable > 모바일 카드" 참고), 수제 표는 `hidden sm:block` + `sm:hidden` 카드. 레퍼런스: 섹터 분석 상세.
- 터치 환경에서는 hover가 동작하지 않으므로 **Tooltip 대신 Popover** 사용.

### 공용화로 UX 일관성 확보 — ⚠️ CRITICAL

**반복되는 인터랙션·UX 패턴(검색 자동완성, 키보드 네비게이션, 드롭다운, 모달, 페이지네이션 등)은 그 자리에서 즉석 구현하지 말고 공용 훅/컴포넌트로 만들어 모든 화면이 동일하게 동작하게 할 것.** 한 곳만 좋고 다른 곳은 빠지는 일이 없어야 한다 — UX는 앱 전체에서 일관돼야 한다.

- 새 UX를 붙일 때 먼저 **이미 공용 훅/컴포넌트가 있는지 확인**하고 있으면 재사용한다. 없는데 두 곳 이상에서 쓸 패턴이면 **공용으로 추출**한 뒤 적용한다.
- 기존에 한 곳에만 있던 좋은 동작은, 같은 류의 다른 UI에도 **빠짐없이 적용**한다 (예: 검색창 키보드 네비게이션).
- 적용 예:
  - **검색 자동완성 키보드 네비게이션**(↑/↓/Enter/Esc): 공용 훅 `src/hooks/use-typeahead-nav.ts`(`useTypeaheadNav`)를 쓴다. 모든 검색창은 이 동작을 지원해야 한다 (종목찾기·13F·섹터 관리에 적용됨). [[종목 검색 한국어 입력 지원]]과 함께 검색 UI의 baseline. **방향키는 wrap하지 않고 양 끝에서 멈춘다** — 최하단에서 ↓를 또 눌러도 최상단으로 순환하지 않고, 최상단에서 ↑도 마찬가지(순환은 어느 항목이 끝인지 헷갈리게 함).
  - **종목 검색 데이터 소스**: `useStockSuggestions`(한글/영문 자동 분기) 공용 훅.
  - **삭제(되돌릴 수 없는 액션) 확인**: 모든 삭제·제거 기능은 실행 전 반드시 한 번 더 확인을 받는다. `window.confirm` 같은 브라우저 기본 대화상자를 쓰지 말고 공용 컴포넌트 `src/components/common/confirm-dialog.tsx`(`ConfirmDialog`, shadcn AlertDialog 기반)로 모달을 띄울 것. 삭제 버튼을 `trigger`로 넘기고 `onConfirm`에 실제 mutation을 연결한다. (섹터/섹터 항목/메뉴 삭제에 적용됨.) 토글성 가역 액션(즐겨찾기 on/off 등)은 예외.
  - **아코디언/펼침은 항상 부드럽게**: 모든 아코디언·collapsible·펼침 영역은 즉시 토글(display none↔block)하지 말고 **높이 기반 애니메이션으로 부드럽게** 열고 닫는다. 두 가지 공용 방식 중 하나를 쓸 것: ① shadcn `Collapsible`(`src/components/ui/collapsible.tsx`) — `CollapsibleContent`에 부드러운 애니메이션(`animate-collapsible-down/up`, tw-animate-css 제공)이 **기본 내장**되어 있으니 그냥 쓰면 된다. ② Collapsible을 안 쓰는 곳은 `grid-rows-[0fr]`↔`grid-rows-[1fr]` + `transition-[grid-template-rows] duration-200`(내부 wrapper `overflow-hidden`) 패턴(menus 관리·섹터 분석 상세에 적용됨). 펼침 화살표(chevron)는 `transition-transform`으로 함께 회전시킨다.
  - **가역적 mutation은 낙관적 업데이트(optimistic update) 기본**: 즐겨찾기 on/off·읽음 처리·토글·제거 등 **되돌릴 수 있는 액션은 서버 응답을 기다리지 말고 즉시 UI에 반영**한다(긍정적 반영 우선 — 사용자가 누르면 바로 사라지거나 바뀌게). react-query `useMutation` 패턴: `onMutate`에서 `cancelQueries` → 관련 쿼리 스냅샷 저장 → 캐시 즉시 수정(연관 캐시가 여러 개면 `setQueriesData`로 전체/타입별 등 **모두** 갱신), `onError`에서 스냅샷으로 **롤백**(+전역 에러 토스트), `onSettled`에서 `invalidateQueries`로 서버와 reconcile. 레퍼런스 구현: `src/lib/services/favorites/use-favorite-mutation.ts`의 `useRemoveFavorite`. ⚠️ 목록이 **2차 파생 fetch**(예: 즐겨찾기 cik 집합 → 13F by-ciks)에 의존하면, 그 쿼리에 `placeholderData: keepPreviousData`를 줘 키 변경 시 스켈레톤 깜빡임을 막고 + 화면단에서 현재 키 집합으로 한 번 더 필터해 잔여 행을 제거한다(`use-thirteenf-by-ciks.ts` + `favorite-13f-table.tsx`). (비가역·위험 액션의 사전 확인은 위 ConfirmDialog 규칙, 낙관적 반영과 병행 가능.)
- **단, 사용자가 지정한 방식보다 더 나은 패턴/추상화가 있다고 판단되면 그대로 따르지 말고 먼저 제안할 것.** (예: 더 적합한 기존 컴포넌트, 접근성·일관성·유지보수에서 나은 구조). 근거를 들어 제안하고, 사용자가 선택하게 한다.

### Table 컬럼 정렬

테이블 컬럼 정렬은 데이터 성격으로 결정한다. DataTable(`src/components/common/data-table`)에서는 columnDef의 `meta.align`으로 지정 (헤더/셀에 함께 적용됨). 셀 안 wrapper div나 커스텀 header 함수로 정렬을 우회하지 말 것.

- **텍스트**(이름·제목 등 가변 길이): 왼쪽 정렬 (기본값, `align` 생략)
- **숫자**(금액·개수 등 크기 비교 값): 오른쪽 정렬 (`align: 'right'`)
- **고정 양식 값**(증감 배지, 날짜, sparkline 등 폭이 일정한 값): 중앙 정렬 (`align: 'center'`)

### shadcn 컴포넌트

- `src/components/ui/`에 없는 shadcn 컴포넌트가 필요하면 **항상 최신 shadcn 기준**으로 추가한다 (v4 스타일: `data-slot` 속성, `cn` 유틸).
- 버전이 맞지 않아 충돌하면 구버전에 맞춰 우회하지 말고, **관련 의존성을 최신으로 올리는 방향**으로 진행한다.
- 라우팅이 아닌 상태 기반 인터랙션이면 `<a href>` 대신 `<button>`으로 구성 (예: `ui/pagination.tsx`).

## DataTable (공용 테이블) 사용법

`src/components/common/data-table/` — TanStack Table + shadcn Table 기반 공용 컴포넌트. **headless 인스턴스 주입 패턴**: 호출 측이 `useReactTable()`로 만든 `table` 인스턴스를 넘기므로, TanStack의 모든 기능을 컴포넌트 수정 없이 쓸 수 있다.

- 컬럼 정의는 `columns.tsx`로 분리. 정렬은 `meta.align`, 행 클릭은 table `meta.onRowClick`. 셀 내부에 자체 버튼이 있으면 `stopPropagation`으로 row 클릭과 구분.
- `rowKey`: `row.original`에서 React key로 쓸 필드명 (예: `rowKey="cik"`).
- **서버 페이지네이션**: `manualPagination: true` + `pageCount` + `state: { pagination }` + `onPaginationChange`. TanStack `pageIndex`는 0-based, API `page`는 1-based 변환 주의. react-query는 `placeholderData: keepPreviousData`, 페이지 전환 중 스켈레톤은 `isLoading || isFetching`을 `isLoading` prop으로 전달.
- **페이지 전환 시 스크롤 최상단 리셋(내장)**: `pageIndex`가 바뀌면 DataTable이 세로 스크롤 영역을 자동으로 최상단(`scrollTo({ top: 0 })`)으로 되돌린다 — 새 페이지는 항상 위에서부터 보이게. 별도 설정 불필요(서버·클라 페이지네이션 공통). 페이지네이션 없는 테이블은 `pageIndex`가 0 고정이라 영향 없음.
- `scrollX`: 기본(false)은 비율 폭이라 가로 스크롤 없음. true면 px 폭 + `min-width`로 컨테이너가 좁을 때만 가로 스크롤.
- 페이지 크기를 바꾸면 항상 1페이지로 리셋된다 (pagination 컴포넌트 내장 동작).

### 모바일 카드 (<640px) — ⚠️ CRITICAL

**표는 모바일에서 가로 스크롤 대신 카드로 보여준다.** `mobileCard` prop을 주면 데스크톱은 표 그대로, 모바일(<640px)은 **행별 카드**로 자동 전환된다(데스크톱 표는 `hidden sm:block`으로 감싸기만 해서 마크업·sticky 헤더·스크롤 전부 무변화, 카드 스택을 `sm:hidden`으로 추가). `scrollX`(가로 스크롤) 표에는 사실상 필수.

- **`mobileCard`(=true) — 자동 카드**: 컬럼 정의로부터 카드를 만든다. 컬럼 `meta`로 배치 제어:
  - `mobileTitle`: 카드 제목(라벨 없이 크게). 보통 이름 열.
  - `mobileHeaderAction`: 카드 우상단 액션(예: 즐겨찾기 별표).
  - `mobileFullWidth`: 2열을 가로지르는 전체폭 — **그래프/스파크라인·바 등 넓은 셀**(그래프는 항상 이걸로).
  - `mobileHidden`: 카드에서 제외(스페이서 열 등). `mobileLabel`: 라벨 override(기본은 header 문자열).
  - 이 힌트들은 `mobileCard`를 안 켠 표에선 무시되므로 **공용 컬럼(예: `thirteenFColumns`, `buildSectorColumns`)에 미리 달아 둬도 안전**.
- **`mobileCard={(row) => …}`(함수) — 맞춤 카드**: 자동 배치가 어색한 특수 표만 카드 내용을 직접 렌더(DataTable이 테두리/패딩/행클릭 shell을 감싼다).
- **DataTable을 쓰는 새 표는 `mobileCard`만 켜면 카드가 자동으로 붙는다 — 페이지에서 카드를 따로 구현하지 말 것.** DataTable이 아닌 수제 그리드 표(예: 즐겨찾기 종목 표)만 `hidden sm:block`(표) + `sm:hidden`(카드)로 직접 처리하고, 값 계산은 `deriveRow`류로 두 경로가 공용하게 한다.
- 적용됨: 13F(메인·즐겨찾기)·마켓 섹터(GICS/산업)·즐겨찾기 섹터·종목 보고서·즐겨찾기 종목(수제).

## React Compiler 주의 — ⚠️ CRITICAL

`next.config.ts`에 `reactCompiler: true`가 켜져 있다.

- TanStack Table의 `useReactTable()`처럼 **참조는 고정한 채 내부 상태를 mutate하는 인스턴스**를 반환하는 API는 컴파일러 memoization과 충돌한다 → 인스턴스를 받아 `getState()` 등을 읽는 컴포넌트가 **부분적으로만 갱신**되는 버그 발생 (예: pageCount는 바뀌는데 select 값은 stale).
- 이런 인스턴스를 생성하거나 props로 받아 읽는 컴포넌트 파일에는 `'use client'` 아래 `'use no memo'` 지시어를 추가해 컴파일러에서 제외할 것. (적용 예: `src/components/common/data-table/*`, 13f `page.tsx`)
- lint의 `react-hooks/incompatible-library` 경고("returns functions which cannot be memoized")가 이 케이스의 신호다.

## Code Style

- **언어**: TypeScript 엄격 모드 (`strict: true`). `any` 사용 원칙적으로 금지. 불가피하게 사용할 경우 해당 줄에 이유를 주석으로 명시할 것.
- **Import**: ES Module (`import/export`). CommonJS(`require`) 사용 금지.
- **컴포넌트**: 함수형 컴포넌트 + React Hooks만 사용. 클래스형 사용 금지.
- **네이밍**:
  - 컴포넌트 파일: `kebab-case.tsx` (예: `app-sidebar.tsx`, `user-profile-card.tsx`)
  - 컴포넌트 함수명: `export default function PascalCase` (예: `export default function AppSidebar()`)
  - 유틸 / 훅 파일: `kebab-case.ts` (예: `use-vela-data.ts`, `format-price.ts`)
  - 훅 이름: `use`로 시작 (예: `useVelaData`)
- **구조 분해**: import 및 props에서 가능하면 구조 분해 사용.
- **상수**: 매직 넘버·문자열은 상수로 분리.
- **파일 내 함수 배치 — `export default function`을 맨 위에**: 파일의 주(主) 컴포넌트인 `export default function`을 (상수/타입 정의 바로 다음의) **파일 상단에 둔다.** 그 파일에서만 쓰는 헬퍼 함수·서브 컴포넌트(예: `Section`, `SectionNav`, `Sparkline`, 행 컴포넌트 등)는 **default export 함수 아래에 정의한다.** 파일을 열면 그 파일이 무엇인지(엔트리 컴포넌트)가 먼저 보이도록 하기 위함. (함수 선언은 호이스팅되므로 아래에 둬도 위에서 참조 가능하다.)

## What Claude Gets Wrong (Known Issues)

위 ⚠️ CRITICAL 섹션 위반이 반복 실수의 대부분: Prisma 재생성/재시작 누락 · `fetch` 사용 · AI 로직을 web에 중복 작성 · hardcoded static map · `PaginatedResponse` 미준수와 무지성 `q` 파라미터 · 요청 없는 스타일 변경. 그 외 고유 사항:

- 새 라우트/엔드포인트 추가 시 `/vela` base path를 빠뜨리는 것.
- `console.log`를 디버그용으로 남겨두는 것 → 커밋 전 제거할 것.
- API 응답이 `null` + `404`인 경우를 에러로 오인 → 의도된 "데이터 없음" 패턴인 경우가 있음 (예: `/api/overview/insight`).
- Edge Function의 DB 작업에서 Prisma 사용 시도 → Deno 환경에서 호환 어려움, `@supabase/supabase-js` 사용.

## Claude 작업 권한

- **읽기 전용(변경 없는) 작업은 종류 불문 사전 허락 없이 실행해도 된다**: 파일 읽기/grep/탐색, DB SELECT(진단/검증 목적), curl 등 읽기성 HTTP 요청 전부 포함. 물어보지 말 것.
- 상태를 바꾸는 작업(DB 쓰기·삭제, 스키마 변경 등)은 사용자가 요청한 작업 범위 내에서만.

## Compaction Instructions

컨텍스트 압축 시 반드시 보존할 것:

- 수정된 파일 목록
- 현재 진행 중인 작업 상태
- 실패한 테스트 또는 미해결 오류
