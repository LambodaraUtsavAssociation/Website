'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, Eye, EyeOff, AlertCircle, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <form onSubmit={handleLogin} className="space-y-5">
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start space-x-2.5 shadow-xs animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <span className="font-semibold leading-relaxed">{error}</span>
        </div>
      )}

      {/* Admin Email Input */}
      <div>
        <label className="text-[10px] sm:text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
          <span>Admin Email Address</span>
          <span className="text-[9px] text-orange-600 font-mono font-bold lowercase">authorized access only</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Mail className="w-4 h-4 text-orange-500/80" />
          </div>
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vinayakachavithiprp@gmail.com"
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50/80 border border-slate-300/90 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all font-sans"
          />
        </div>
      </div>

      {/* Password Input with Show/Hide Toggle */}
      <div>
        <label className="text-[10px] sm:text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1.5">
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Lock className="w-4 h-4 text-orange-500/80" />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            className="w-full pl-10 pr-11 py-3 rounded-2xl bg-slate-50/80 border border-slate-300/90 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all font-sans"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-orange-600 transition-colors focus:outline-none"
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 via-saffron-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-extrabold tracking-wider uppercase shadow-xl shadow-orange-500/25 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-95 border border-white/20"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Verifying Credentials...</span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4 text-white" />
            <span>Authenticate &amp; Open Dashboard</span>
          </>
        )}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-gradient-to-br from-slate-100 via-orange-50/30 to-slate-100 relative overflow-hidden font-sans">
      {/* Background Soft Glow Orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-300/20 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-amber-300/20 blur-3xl rounded-full pointer-events-none" />

      {/* Faded Logo Watermark Background — Increased size & enhanced mobile visibility */}
      <div className="absolute inset-0 p-2 sm:p-6 flex items-center justify-center overflow-hidden pointer-events-none z-0">
        <img
          src="/images/village_logo_icon.png"
          alt="Lambodara Utsav Emblem Watermark Background"
          className="max-h-[86vh] sm:max-h-[90vh] max-w-[95vw] sm:max-w-[90vw] w-auto h-auto object-contain opacity-[0.20] sm:opacity-[0.14] select-none"
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-9 rounded-3xl border border-orange-200/80 shadow-2xl shadow-orange-500/10 space-y-6">
          <div className="text-center space-y-2">
            {/* Clean Logo Display without outline */}
            <div className="mx-auto mb-2 flex items-center justify-center">
              <img
                src="/images/village_logo_icon.png"
                alt="Lambodara Utsav Emblem"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain filter drop-shadow-sm border-0 outline-none"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl text-slate-900 font-editorial font-bold tracking-tight">
              Authorized Admin Portal
            </h1>
            <p className="text-xs text-slate-600 font-sans font-medium">
              Lambodara Utsav Association &bull; Papi Reddy Palli
            </p>
          </div>

          <Suspense fallback={<div className="text-center text-xs text-slate-500 py-4">Loading login portal...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
