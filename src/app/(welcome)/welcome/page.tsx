'use client';

import { useSession } from 'next-auth/react';
import { Contact } from './components/contact';
import { Features } from './components/features';
import { Footer } from './components/footer';
import { Header } from './components/header';
import { Hero } from './components/hero';
import { Philosophy } from './components/philosophy';

export default function Page() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F1115] dark:bg-[#0F1115] dark:text-[#F8FAFC] font-sans selection:bg-blue-500/30 transition-colors duration-300">
      {/* {status === 'unauthenticated' && ( */}
      <>
        <Header session={session} />
        <Hero session={session} />
        <Features />
        <Philosophy />
        <Contact />
        <Footer />
      </>
      {/* )} */}
    </div>
  );
}
