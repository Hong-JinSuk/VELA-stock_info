'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const { data: user } = useSession();

  useEffect(() => {
    if (!user) {
      router.push(`/welcome`);
    }
  }, [user, router]);

  return <></>;
}
