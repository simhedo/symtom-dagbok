'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const response = await fetch(`/api/auth?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
        const data = await response.json();
        
        if (!response.ok) {
          setError(data.error || 'Inloggning misslyckades');
          setLoading(false);
          return;
        }
        
        // Save user to localStorage
        localStorage.setItem('gut_tracker_user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        // Register
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          setError(data.error || 'Registrering misslyckades');
          setLoading(false);
          return;
        }
        
        // Save user to localStorage
        localStorage.setItem('gut_tracker_user', JSON.stringify(data.user));
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('Ett fel uppstod. Försök igen.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">🥗</h1>
          <h2 className="text-3xl font-bold mb-4">Smart Gut Tracker</h2>
          <p className="text-gray-400">
            {isLogin ? 'Välkommen tillbaka!' : 'Skapa ditt konto'}
          </p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          {/* Toggle Login/Register */}
          <div className="flex gap-2 mb-6 bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              className={`flex-1 py-2 rounded-md transition-colors ${
                isLogin ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Logga in
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              className={`flex-1 py-2 rounded-md transition-colors ${
                !isLogin ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Registrera
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Namn
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ditt namn"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@email.se"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Lösenord
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
              {!isLogin && (
                <p className="text-xs text-gray-500 mt-1">Minst 6 tecken</p>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (isLogin ? !email || !password : !email || !password || !name)}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 rounded-lg transition-colors"
            >
              {loading ? 'Laddar...' : (isLogin ? 'Logga in' : 'Skapa konto')}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500">
          Genom att använda appen godkänner du våra villkor
        </p>
      </div>
    </div>
  );
}
