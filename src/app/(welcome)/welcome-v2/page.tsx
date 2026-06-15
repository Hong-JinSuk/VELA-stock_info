'use client';

import { useSession } from 'next-auth/react';
import { Footer } from '../welcome/components/footer';
import { Header } from '../welcome/components/header';
import CtaSection from './components/cta-section';
import HeroV2 from './components/hero-v2';
import ProductShowcase from './components/product-showcase';

// welcome-v2 — 실사용 화면(컴포넌트 재현 목업)을 전면에 내세운 새 랜딩 페이지.
// 기존 /welcome 은 그대로 두고 /welcome-v2 로 비교/검토 후 교체용.
export default function Page() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F1115] transition-colors duration-300 selection:bg-blue-500/30 dark:bg-[#0F1115] dark:text-[#F8FAFC]">
      <Header session={session} />
      <HeroV2 session={session} />
      <ProductShowcase />
      <CtaSection session={session} />
      <Footer />
    </div>
  );
}
