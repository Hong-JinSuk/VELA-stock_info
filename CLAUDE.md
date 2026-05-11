@AGENTS.md

# VELA

개인 프로젝트 VELA의 Claude Code 설정 파일입니다.

## Project Overview

- **Stack**: Next.js (App Router) + TypeScript + Tailwind CSS
- **Package Manager**: `yarn` (또는 사용 중인 것으로 교체)
- **Purpose**: 개인화된 주가예측 서비스 제공

## Commands

```bash
yarn run dev       # 개발 서버 실행
yarn run build     # 프로덕션 빌드
yarn run lint      # ESLint 검사
```

> 작업 후 반드시 `lint`를 실행해 오류가 없는지 확인할 것.

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

## Project Structure

```
src/
├── app/          # Next.js App Router 페이지
├── components/   # 재사용 컴포넌트
├── constants/    # 매직 넘버, 문자열 상수 관리
├── hooks/        # 커스텀 훅
├── lib/          # 유틸리티 / 헬퍼
├── motion/       # motion/react
├── schemas/      # react-hook-form 관련 zod
├── store/        # jotai / atom 관리
└── types/        # 공유 TypeScript 타입
```

## What Claude Gets Wrong (Known Issues)

- 스타일 요청 없이 Tailwind 클래스를 임의로 추가하거나 수정하는 것 → 하지 말 것.
- `console.log` 를 디버그용으로 남겨두는 것 → 커밋 전 제거할 것.

## Compaction Instructions

컨텍스트 압축 시 반드시 보존할 것:

- 수정된 파일 목록
- 현재 진행 중인 작업 상태
- 실패한 테스트 또는 미해결 오류
