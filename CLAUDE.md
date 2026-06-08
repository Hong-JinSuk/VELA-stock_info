@AGENTS.md

# VELA

개인 프로젝트 VELA의 Claude Code 설정 파일입니다.

## Project Overview

- **Stack**: Next.js (App Router) + TypeScript + Tailwind CSS v4
- **Package Manager**: `yarn`
- **Purpose**: 개인화된 주가예측 서비스 제공
- **Base path**: `/vela` (`NEXT_PUBLIC_BASE_PATH`)

## Commands

```bash
yarn run dev                  # 로컬 env 사용 (.env.local)
yarn run build                # prisma generate + migrate deploy + next build
yarn run lint                 # ESLint 검사
yarn run migrate:dev <이름>   # prisma migrate dev (개발용, Supabase에 신규 마이그레이션 생성/적용)
npx prisma generate           # Prisma 클라이언트 재생성 (스키마 변경 후 필수)
```

> 작업 후 반드시 `lint`를 실행해 오류가 없는지 확인할 것.

## DB / Prisma Workflow — ⚠️ CRITICAL

**`prisma/schema/*.prisma`를 수정한 뒤에는 반드시 아래 순서를 안내할 것.** 클라이언트만 재생성 안 하면 dev 서버는 옛 스키마로 쿼리해서 `Unknown argument 'xxx'` 같은 런타임 에러가 난다.

1. `yarn run migrate:dev <마이그레이션_이름>` — DB에 마이그레이션 적용
2. `npx prisma generate` — `src/generated/prisma` 클라이언트 재생성 (migrate:dev가 자동 실행하긴 하지만 dev 서버가 캐시된 모듈을 잡고 있을 수 있으므로 명시적으로 확인)
3. dev 서버 재시작 (`Ctrl+C` → `yarn run dev`) — Next.js HMR이 생성물을 못 잡는 경우가 있음. 필요하면 `rm -rf .next`도 같이.

스키마 수정만 하고 migrate는 미루는 경우라도 **클라이언트 재생성과 dev 서버 재시작은 항상 안내할 것.**

## Backend & Data

- **DB**: Supabase (PostgreSQL), Prisma ORM
- **Auth**: NextAuth (Google OAuth + Credentials)
- **AI Server**: Supabase Edge Functions (`gemini-server` 레포에서 관리)
  - Endpoint base: `NEXT_PUBLIC_GEMINI_SERVER`
  - 로컬 개발: `http://localhost:3001/ai` (로컬 Express 서버)
  - 프로덕션: `https://<project-ref>.supabase.co/functions/v1`
- **Prisma migrate**: 빌드 시 `MIGRATE_MODE=true` 환경변수로 `DIRECT_URL` 사용 (pgbouncer는 DDL 지원 안 함)
- **Cron**: Supabase `pg_cron` + `pg_net`으로 Edge Function 호출 (예: `overview-snapshot` 08:00 KST)

## State Management

- **Server state**: TanStack Query (캐싱은 `staleTime`으로 명시)
- **Client state**: jotai (atom은 `src/store/`에 모음)
- **Form**: react-hook-form + zod (`src/schemas/`)

## API Calls — ⚠️ CRITICAL

- **HTTP 클라이언트**: 모든 API 호출은 `src/lib/api/axios.ts`의 `api` 인스턴스를 사용한다. `fetch`는 사용하지 말 것 (서버/클라이언트 모두).
  - 자체 API 호출(상대 경로): `api.get('/overview/insight')` — `NEXT_PUBLIC_API_PATH` baseURL이 자동 prefix.
  - 외부 API(gemini-server 등) 호출: `api.post(\`${GEMINI_SERVER}/...\`, payload)` 처럼 절대 URL 전달 (axios가 baseURL을 무시함).
  - 긴 응답이 예상되는 호출(Gemini 등)은 `{ timeout: 60000 }` 등으로 timeout을 명시할 것 (기본 10s).
  - 응답 에러는 `error-interceptors`가 `throw new Error(message)` 형태로 정규화하므로, 호출 측은 `error instanceof Error ? error.message : ...` 패턴으로 받을 수 있음.

## AI / Gemini API Workflow — ⚠️ CRITICAL

**Gemini 및 AI 관련 신규 엔드포인트는 반드시 `gemini-server` 프로젝트를 참조해서 작성할 것.** (추가 working directory에 등록되어 있음.)

- 신규 AI 엔드포인트는 **gemini-server에 라우트를 먼저 추가**하고, vela web은 그 엔드포인트를 호출하는 thin wrapper로 작성한다.
- vela web 쪽에서 Gemini 호출(프롬프트 정의, vertex 설정, 응답 파싱)을 중복 작성하지 말 것. 단일 소스는 항상 gemini-server.
- DB 저장이 포함된 배치 로직(예: `runOverviewSnapshot`)은 gemini-server 쪽에서 cron과 manual trigger가 동일 함수를 재사용하도록 설계.
- cron이 죽으면 안 되므로 cron 래퍼는 try/catch로 흡수하되, manual 트리거용 함수는 throw해서 호출 측이 에러를 받을 수 있게 분리.

## Error Handling

- API 호출은 hook 안에서 → 오류는 `throw new Error(message)`로 던질 것
- `src/lib/api/error-interceptors.ts`가 받아서:
  - 메시지가 있으면 그대로 toast로 표시
  - 없으면 status code → `STATUS_MESSAGES` 매핑 fallback
  - 그것도 없으면 `FALLBACK_ERROR_MESSAGE` 표시
- 특정 mutation에서 글로벌 toast를 끄려면 `meta: { ignoreGlobalError: true }`

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

## Responsive Style — ⚠️ CRITICAL

**스타일 변경이 명시적으로 요청되지 않은 경우, 기존 반응형 레이아웃과 Tailwind 클래스를 절대 변경하지 말 것.**

- 기능 추가 또는 로직 변경 시 기존 `sm:`, `md:`, `lg:` 브레이크포인트 클래스를 그대로 유지.
- 새 컴포넌트를 만들 때는 기존 컴포넌트의 반응형 패턴을 참고해 일관성 유지.
- 레이아웃을 건드려야 할 경우 먼저 확인 후 진행할 것.
- 컴포넌트를 만들 때는 모바일 환경도 고려할 것.

## Mobile Considerations — ⚠️ CRITICAL

- **UI(컴포넌트/페이지)를 추가하거나 수정하면 모바일 폭(< 640px) 검증은 필수.** 데스크톱만 확인하고 끝내지 말 것.
  - 새 컴포넌트는 처음부터 `grid-cols-1`/`flex-col` 기본 + `sm:`·`lg:`로 확장하는 mobile-first로 작성.
  - 좁은 폭에서 깨지기 쉬운 곳을 항상 점검: 가로 배치(`justify-between`) 카드, 버튼 토글 그룹, 제목+칩 한 줄, 긴 라벨 → 필요하면 `flex-wrap`·`break-keep`·세로 스택(`flex-col sm:flex-row`)으로 처리.
  - 작업 완료 보고 시 "모바일 폭에서 확인함"을 명시할 것.
- 터치 환경에서는 hover가 동작하지 않으므로 **Tooltip 대신 Popover** 사용.

## Static Fallback Policy — ⚠️ CRITICAL

**사용자가 명시적으로 요청하거나 실제로 다른 방법이 전혀 없는 경우가 아니면, hardcoded static 대안(예: CUSIP→ticker 매핑 테이블, 종목 리스트, 회사명 dictionary 등)을 만들지 말 것.**

- 이유: static 데이터는 (1) 커버리지가 좁고, (2) 손으로 적은 entry는 휴먼 에러(잘못된 CUSIP/매핑 등) 발생, (3) 외부 소스가 바뀌면 stale 됨.
- 우선순위: API/서비스(예: OpenFIGI, SEC EDGAR) > DB 캐시 > static fallback.
- 외부 API가 일시적으로 실패할 수 있다는 우려가 있어도, 그 자체로는 static 대안의 정당화 사유가 아님. 캐시·재시도·에러 핸들링이 우선.
- 정말 static이 필요한 경우(예: API에 없는 도메인 특화 매핑, 사용자 override)는 먼저 사유 설명하고 사용자 확인 후 진행.

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

## What Claude Gets Wrong (Known Issues)

- 스타일 요청 없이 Tailwind 클래스를 임의로 추가하거나 수정하는 것 → 하지 말 것.
- `console.log` 를 디버그용으로 남겨두는 것 → 커밋 전 제거할 것.
- 새 라우트/엔드포인트 추가 시 `/vela` base path를 빠뜨리는 것.
- API 응답이 `null` + `404` 인 경우를 에러로 오인 → 의도된 "데이터 없음" 패턴인 경우가 있음 (예: `/api/overview/insight`).
- Edge Function의 DB 작업에서 Prisma 사용 시도 → Deno 환경에서 호환 어려움, `@supabase/supabase-js` 사용.
- Prisma 스키마 수정 후 `prisma generate` + dev 서버 재시작을 빠뜨리는 것 → 옛 클라이언트로 쿼리하다 런타임 에러. "DB / Prisma Workflow" 섹션 참고.
- `fetch`로 API를 호출하는 것 → 반드시 `src/lib/api/axios.ts`의 `api` 인스턴스를 사용. "API Calls" 섹션 참고.
- AI 관련 로직을 vela web 안에서 직접 작성하는 것 → Gemini 호출/프롬프트는 `gemini-server`에만 두고 vela web은 호출만. "AI / Gemini API Workflow" 섹션 참고.
- 외부 API/서비스로 풀 수 있는 매핑·데이터를 손으로 hardcoded static map으로 만드는 것 → 휴먼 에러와 커버리지 한계 발생. "Static Fallback Policy" 섹션 참고.

## Compaction Instructions

컨텍스트 압축 시 반드시 보존할 것:

- 수정된 파일 목록
- 현재 진행 중인 작업 상태
- 실패한 테스트 또는 미해결 오류
