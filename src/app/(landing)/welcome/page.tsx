'use client';

import { useTheme } from '@/hooks/useTheme';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Contact } from './components/Contact';
import { Features } from './components/Features';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Philosophy } from './components/Philosophy';

export default function Page() {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();
  const { data: session, status } = useSession();

  // if(session){
  //   router.push('/home')
  // }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F1115] dark:bg-[#0F1115] dark:text-[#F8FAFC] font-sans selection:bg-blue-500/30 transition-colors duration-300">
      {/* {status === 'unauthenticated' && ( */}
      <>
        <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        <Hero />
        <Features />
        <Philosophy />
        <Contact />
        <Footer />
      </>
      {/* )} */}
    </div>
  );
}
