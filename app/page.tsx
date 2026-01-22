'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, saveUser } from '@/lib/storage';

export default function WelcomePage() {
  const [name, setName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (user) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      saveUser(name.trim());
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">🥗</h1>
          <h2 className="text-3xl font-bold mb-4">Smart Gut Tracker</h2>
          <p className="text-gray-400">
            Spåra din maghälsa med AI-drivna insikter
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ditt namn"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-center text-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-4 rounded-xl transition-colors text-lg"
          >
            Kom igång
          </button>
        </form>
      </div>
    </div>
  );
}
