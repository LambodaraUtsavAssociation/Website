'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, ExternalLink, LogOut } from 'lucide-react';

interface AdminHeaderProps {
  associationName?: string;
  villageName?: string;
}

export default function AdminHeader({
  associationName = process.env.NEXT_PUBLIC_ASSOCIATION_NAME || 'Lambodara Utsav Association',
  villageName = process.env.NEXT_PUBLIC_VILLAGE_NAME || 'Papi Reddy Palli',
}: AdminHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {
      // Ignore
    }
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <header className="bg-white border-b-2 border-orange-500 sticky top-0 z-30 px-3 sm:px-8 h-16 flex items-center shadow-xs">
      <div className="w-full max-w-full flex items-center justify-between">
        {/* Left Branding with Emblem */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
          <div
            className="relative flex-shrink-0 bg-transparent drop-shadow-xs"
            style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px' }}
          >
            <picture>
              <source media="(max-width: 767px)" type="image/svg+xml" srcSet="/images/village_logo_icon.svg" />
              <img
                src="/images/village_logo_icon.png"
                alt={`${associationName} (${villageName}) Emblem`}
                width={256}
                height={256}
                className="object-contain w-[36px] h-[36px]"
              />
            </picture>
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <span className="font-editorial text-sm sm:text-lg font-bold text-slate-900 leading-tight truncate">
              {associationName}
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-orange-600 font-sans font-extrabold truncate block mt-0.5">
              {villageName} Admin Portal
            </span>
          </div>
        </div>

        {/* Header Right Actions & Badges */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Link
            href="/"
            target="_blank"
            className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 text-[10px] uppercase font-bold tracking-wider transition-all active:scale-95 shadow-xs"
            title="Open Public Website"
          >
            <span>Public Site</span>
            <ExternalLink className="w-3 h-3 text-orange-600" />
          </Link>

          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[10px] uppercase tracking-wider font-semibold shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
            <span>Master Admin Active</span>
          </div>

          {/* Logout Button (Visible on mobile & desktop) */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-xs cursor-pointer"
            title="Logout of Admin Portal"
            aria-label="Logout of Admin Portal"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

