'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, Images, Tag, ExternalLink, LogOut, ShieldCheck, Menu, X, Sparkles, Compass, ChevronRight, Upload } from 'lucide-react';

interface AdminSidebarProps {
  adminEmail?: string;
}

export default function AdminSidebar({
  adminEmail = 'admin@VinayakaChavithi.village',
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {
      // Ignore
    }
    router.push('/admin/login');
    router.refresh();
  };

  const links = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Media Library', href: '/admin/memories', icon: Images },
    { name: 'Upload Media', href: '/admin/upload', icon: Upload },
    { name: 'Hero Carousel', href: '/admin/hero', icon: Sparkles },
    { name: 'Festival Years', href: '/admin/years', icon: Calendar },
    { name: 'Categories', href: '/admin/categories', icon: Tag },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Main Sidebar (Desktop fixed sidebar + Mobile drawer) */}
      <aside
        className={`${mobileOpen
          ? 'fixed top-16 left-0 bottom-0 z-50 w-72 flex'
          : 'hidden md:flex'
          } md:fixed md:top-16 md:left-0 md:bottom-0 md:w-72 md:z-30 bg-white border-r border-orange-200 p-5 flex-col justify-between overflow-y-auto transition-all shadow-sm`}
      >
        <div className="space-y-6">
          <div>
            <nav className="space-y-1.5">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${isActive
                      ? 'bg-orange-500 text-white border-l-4 border-orange-700 shadow-md'
                      : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50/70'
                      }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-orange-500'}`} />
                      <span>{link.name}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Admin User Info & Logout Controls in Sidebar Bottom */}
        <div className="pt-5 mt-5 border-t border-orange-100 space-y-3">
          <div className="p-3.5 rounded-2xl bg-orange-50/80 border border-orange-200 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-300 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4 text-orange-600" />
            </div>
            <div className="min-w-0">
              <span className="text-xs text-slate-900 font-bold block truncate">{adminEmail}</span>
              <span className="text-[10px] text-orange-600 font-semibold uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-orange-500" />
                <span>Master Admin</span>
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-xs"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
