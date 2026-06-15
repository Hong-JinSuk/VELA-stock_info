@AGENTS.md

# VELA

개인 프로젝트 VELA의 Claude Code 설정 파일입니다.

## Overview & Stack

- **Purpose**: 개인화된 주가예측 서비스
- **Web**: Next.js (App Router) + TypeScript (strict) + Tailwind CSS v4 · base path `/vela` (`NEXT_PUBLIC_BASE_PATH`) · 패키지 매니저 `yarn`
- **DB**: Supabase (PostgreSQL) + Prisma ORM — 스키마는 `prisma/schema/` 분할 관리, 클라이언트 생성물은 `src/generated/`에 커밋됨
- **Auth**: NextAuth (Google OAuth + Credentials)
- **AI Server**: 별도 레포 `gemini-server` (Supabase Edge Functions + 로컬 Express)
  - Endpoint base: `NEXT_PUBLIC_GEMINI_SERVER` — 로컬 `http://localhost:3001/ai`, 프로덕션 `https://<project-ref>.supabase.co/functions/v1`
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
- 터치 환경에서는 hover가 동작하지 않으므로 **Tooltip 대신 Popover** 사용.

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
- `scrollX`: 기본(false)은 비율 폭이라 가로 스크롤 없음. true면 px 폭 + `min-width`로 컨테이너가 좁을 때만 가로 스크롤.
- 페이지 크기를 바꾸면 항상 1페이지로 리셋된다 (pagination 컴포넌트 내장 동작).

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
