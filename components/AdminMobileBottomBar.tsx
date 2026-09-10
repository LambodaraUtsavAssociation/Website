'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Sparkles, Images, Tag, Calendar, Upload, LogOut } from 'lucide-react';
import { useState } from 'react';

interface AdminMobileBottomBarProps {
  onOpenUpload?: () => void;
}

export default function AdminMobileBottomBar({ onOpenUpload }: AdminMobileBottomBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {
      // Ignore — redirect regardless
    }
    router.push('/admin/login');
  };

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Admin Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-orange-200 shadow-2xl px-1 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex items-center justify-around touch-manipulation"
      >
        {/* Home / Overview Tab */}
        <Link
          href="/admin"
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all min-w-0 flex-1 ${
            pathname === '/admin'
              ? 'text-orange-600 font-extrabold scale-105'
              : 'text-slate-500 hover:text-slate-800 font-semibold'
          }`}
        >
          <LayoutDashboard
            className={`w-4 h-4 sm:w-5 sm:h-5 ${pathname === '/admin' ? 'text-orange-600' : 'text-slate-400'}`}
          />
          <span className="text-[9px] mt-0.5 uppercase tracking-wider font-sans truncate">
            Overview
          </span>
        </Link>

        {/* Media Library Tab */}
        <Link
          href="/admin/memories"
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all min-w-0 flex-1 ${
            pathname.startsWith('/admin/memories')
              ? 'text-orange-600 font-extrabold scale-105'
              : 'text-slate-500 hover:text-slate-800 font-semibold'
          }`}
        >
          <Images
            className={`w-4 h-4 sm:w-5 sm:h-5 ${pathname.startsWith('/admin/memories') ? 'text-orange-600' : 'text-slate-400'}`}
          />
          <span className="text-[9px] mt-0.5 uppercase tracking-wider font-sans truncate">
            Media
          </span>
        </Link>

        {/* Upload Media Tab */}
        <Link
          href="/admin/upload"
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all min-w-0 flex-1 ${
            pathname === '/admin/upload'
              ? 'text-orange-600 font-extrabold scale-105'
              : 'text-slate-500 hover:text-slate-800 font-semibold'
          }`}
        >
          <Upload
            className={`w-4 h-4 sm:w-5 sm:h-5 ${pathname === '/admin/upload' ? 'text-orange-600' : 'text-slate-400'}`}
          />
          <span className="text-[9px] mt-0.5 uppercase tracking-wider font-sans truncate">
            Upload
          </span>
        </Link>

        {/* Hero Carousel Tab */}
        <Link
          href="/admin/hero"
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all min-w-0 flex-1 ${
            pathname === '/admin/hero'
              ? 'text-orange-600 font-extrabold scale-105'
              : 'text-slate-500 hover:text-slate-800 font-semibold'
          }`}
        >
          <Sparkles
            className={`w-4 h-4 sm:w-5 sm:h-5 ${pathname === '/admin/hero' ? 'text-orange-600' : 'text-slate-400'}`}
          />
          <span className="text-[9px] mt-0.5 uppercase tracking-wider font-sans truncate">
            Hero
          </span>
        </Link>

        {/* Years Tab */}
        <Link
          href="/admin/years"
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all min-w-0 flex-1 ${
            pathname === '/admin/years'
              ? 'text-orange-600 font-extrabold scale-105'
              : 'text-slate-500 hover:text-slate-800 font-semibold'
          }`}
        >
          <Calendar
            className={`w-4 h-4 sm:w-5 sm:h-5 ${pathname === '/admin/years' ? 'text-orange-600' : 'text-slate-400'}`}
          />
          <span className="text-[9px] mt-0.5 uppercase tracking-wider font-sans truncate">
            Years
          </span>
        </Link>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all min-w-0 flex-1 text-rose-500 hover:text-rose-700 font-semibold disabled:opacity-50 active:scale-95"
          aria-label="Logout from admin"
        >
          <LogOut
            className={`w-4 h-4 sm:w-5 sm:h-5 text-rose-500 ${loggingOut ? 'animate-pulse' : ''}`}
          />
          <span className="text-[9px] mt-0.5 uppercase tracking-wider font-sans">
            {loggingOut ? '...' : 'Logout'}
          </span>
        </button>
      </nav>
    </>
  );
}
