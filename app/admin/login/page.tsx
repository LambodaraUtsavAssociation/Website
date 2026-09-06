'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, AlertCircle, ArrowLeft } from 'lucide-react';

function LoginForm() {
  const [email, setEmail] = useState('admin@VinayakaChavithi.village');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/admin';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Authentication failed. Check your credentials.');
        setIsLoading(false);
        return;
      }

      router.push(from);
      router.refresh();
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {error && (
        <div className="p-4 rounded-xl bg-maroon-900/60 border border-maroon-700 text-xs text-red-200 flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="text-[11px] font-semibold text-ivory-300 uppercase tracking-wider block mb-1.5">
          Admin Email Address
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@VinayakaChavithi.village"
          className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-charcoal-700 text-sm text-ivory-50 focus:outline-none focus:border-gold-500 transition-colors"
        />
      </div>

      <div>
        <label className="text-[11px] font-semibold text-ivory-300 uppercase tracking-wider block mb-1.5">
          Password
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter admin password"
          className="w-full px-4 py-3 rounded-xl bg-charcoal-900 border border-charcoal-700 text-sm text-ivory-50 focus:outline-none focus:border-gold-500 transition-colors"
        />
      </div>

      <div className="p-3 rounded-xl bg-charcoal-900/60 border border-charcoal-800 text-[11px] text-ivory-400 space-y-1">
        <span className="font-semibold text-gold-400 block">Default Credentials for Demo:</span>
        <p>Email: <code className="text-ivory-200">admin@VinayakaChavithi.village</code></p>
        <p>Password: <code className="text-ivory-200">VillageVinayaka2026!</code></p>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-saffron-600 to-saffron-700 hover:from-saffron-500 hover:to-saffron-600 text-ivory-50 text-xs font-semibold tracking-wider uppercase shadow-glow-saffron disabled:opacity-50 transition-all"
      >
        {isLoading ? 'Verifying Session...' : 'Authenticate & Open Dashboard'}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-charcoal-950 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-saffron-600/10 blur-3xl rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 text-xs text-gold-400 hover:text-gold-300 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Village Memories</span>
        </Link>

        <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-charcoal-700 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-saffron-600/20 border border-saffron-500/40 text-saffron-400 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="font-editorial text-3xl text-ivory-50 font-normal">
              Authorized Admin Portal
            </h1>
            <p className="text-xs text-ivory-400 font-sans">
              Single administrator login for village memory management.
            </p>
          </div>

          <Suspense fallback={<div className="text-center text-xs text-ivory-400 py-4">Loading login credentials...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
