/**
 * 제품 데모 레지스트리.
 *
 * 새 실사용 화면을 추가하려면:
 *   1) demos/ 에 데모 컴포넌트를 하나 만든다 (샘플 데이터로 실제 컴포넌트 재현).
 *   2) 아래 PRODUCT_DEMOS 배열에 한 항목을 추가한다.
 * ProductShowcase가 이 배열을 그대로 렌더하므로 페이지 수정은 필요 없다.
 */

import type { ComponentType } from 'react';
import DashboardDemo from './dashboard-demo';
import StockDetailDemo from './stock-detail-demo';
import ThirteenFDemo from './thirteenf-demo';

export type ProductDemo = {
  id: string;
  eyebrow: string; // 작은 라벨 (예: '거시 대시보드')
  title: string; // 섹션 제목
  description: string; // 한두 문장 설명
  Component: ComponentType;
  // 폭 힌트. 'wide'는 가로가 긴 화면(테이블 등)에 적합 — 좁을 때 가로 스크롤.
  width?: 'default' | 'wide';
};

export const PRODUCT_DEMOS: ProductDemo[] = [
  {
    id: 'dashboard',
    eyebrow: '거시 대시보드',
    title: '시장의 온도를 한눈에',
    description:
      'CPI·금리·고용·변동성 등 핵심 거시 지표를 5단계 신호로 색칠해, 지금 시장이 어떤 국면인지 카드 한 장으로 읽습니다.',
    Component: DashboardDemo,
    width: 'default',
  },
  {
    id: 'thirteenf',
    eyebrow: '13F 고래 추적',
    title: '큰손들이 무엇을 샀나',
    description:
      '버크셔·블랙록·시타델 등 대형 기관의 분기 13F 보고를 운용자산·섹터 비중·주요 매매·추이까지 한 테이블로 정리합니다.',
    Component: ThirteenFDemo,
  },
  {
    id: 'stock-detail',
    eyebrow: '개별 종목',
    title: '종목 하나를 깊게',
    description:
      '주가 추이와 애널리스트 목표주가 컨센서스를 함께 보여줘, 한 종목의 현재 위치와 기대치를 빠르게 파악합니다.',
    Component: StockDetailDemo,
    width: 'default',
  },
];
