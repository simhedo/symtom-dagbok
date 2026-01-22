'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/storage';

export default function WelcomePage() {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/auth');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">🥗</h1>
        <p className="text-gray-400">Laddar...</p>
      </div>
    </div>
  );
}
