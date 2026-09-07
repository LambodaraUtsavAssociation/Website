'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, AlertCircle, ArrowLeft } from 'lucide-react';

function LoginForm() {
  const [email, setEmail] = useState('');
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
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
          Admin Email Address
        </label>
        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vinayakachavithiprp@gmail.com"
          className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors"
        />
      </div>

      <div>
        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
          Password
        </label>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter admin password"
          className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold tracking-wider uppercase shadow-md shadow-orange-500/20 disabled:opacity-50 transition-all cursor-pointer"
      >
        {isLoading ? 'Verifying Credentials...' : 'Authenticate & Open Dashboard'}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-slate-50 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-200/40 blur-3xl rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <Link
          href="/"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 mb-6 transition-colors bg-white px-3 py-1.5 rounded-lg border border-orange-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Village Memories</span>
        </Link>

        <div className="bg-white p-8 sm:p-10 rounded-3xl border-2 border-orange-500 shadow-xl shadow-orange-500/10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 border-2 border-orange-500 text-orange-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl text-slate-900 font-bold tracking-tight">
              Authorized Admin Portal
            </h1>
            <p className="text-xs text-slate-600 font-sans">
              Single administrator login for village memory management.
            </p>
          </div>

          <Suspense fallback={<div className="text-center text-xs text-slate-500 py-4">Loading login credentials...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
