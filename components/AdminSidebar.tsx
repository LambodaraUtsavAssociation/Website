'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, Images, Tag, ExternalLink, LogOut, ShieldCheck, Menu, X } from 'lucide-react';

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
    { name: 'Dashboard Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Festival Years', href: '/admin/years', icon: Calendar },
    { name: 'Media Memories', href: '/admin/memories', icon: Images },
    { name: 'Categories & Chapters', href: '/admin/categories', icon: Tag },
  ];

  return (
    <>
      {/* Mobile Bar Toggle (<768px) */}
      <div className="md:hidden bg-charcoal-900 border-b border-charcoal-800 px-4 py-3 flex items-center justify-between z-30">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-charcoal-850 border border-charcoal-700 text-xs font-semibold text-gold-300 uppercase tracking-wider active:scale-95 transition-all"
        >
          {mobileOpen ? <X className="w-4 h-4 text-gold-400" /> : <Menu className="w-4 h-4 text-gold-400" />}
          <span>{mobileOpen ? 'Close Navigation' : 'Admin Navigation'}</span>
        </button>

        <Link
          href="/"
          target="_blank"
          className="flex items-center space-x-1.5 text-xs text-ivory-300 hover:text-gold-300 uppercase tracking-wider font-semibold px-3 py-1.5 rounded-lg bg-charcoal-950 border border-charcoal-800"
        >
          <span>Public Site</span>
          <ExternalLink className="w-3 h-3 text-gold-400" />
        </Link>
      </div>

      {/* Main Sidebar (Desktop fixed sidebar + Mobile drawer) */}
      <aside
        className={`${
          mobileOpen ? 'block' : 'hidden'
        } md:block w-full md:w-72 bg-charcoal-900/95 border-r border-gold-500/30 p-5 flex flex-col justify-between flex-shrink-0 md:min-h-[calc(100vh-65px)] transition-all`}
      >
        <div className="space-y-6">
          <div>
            <div className="px-3 py-2 border-b border-charcoal-800 mb-3 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.25em] text-gold-400 font-semibold block">
                Sanctuary Navigation
              </span>
              <span className="text-gold-500/60 text-xs font-serif">◇</span>
            </div>

            <nav className="space-y-1.5">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs font-semibold uppercase tracking-[0.12em] transition-all ${
                      isActive
                        ? 'bg-saffron-600/15 text-gold-300 border-l-2 border-gold-400 bg-charcoal-850 shadow-lg'
                        : 'text-ivory-300 hover:text-ivory-50 hover:bg-charcoal-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-gold-400' : 'text-ivory-400'}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* View Public Site Shortcut Button inside Sidebar */}
          <div className="hidden md:block">
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 hover:border-gold-500/40 text-xs font-semibold uppercase tracking-wider text-ivory-200 hover:text-gold-300 transition-all shadow-md"
            >
              <span className="flex items-center space-x-2">
                <ExternalLink className="w-3.5 h-3.5 text-gold-400" />
                <span>View Public Site</span>
              </span>
              <span className="text-[10px] text-ivory-400 font-mono">&rarr;</span>
            </Link>
          </div>
        </div>

        {/* Admin User Info & Logout Controls in Sidebar Bottom */}
        <div className="pt-6 mt-6 border-t border-charcoal-800 space-y-4">
          <div className="p-3.5 rounded-2xl bg-charcoal-950/80 border border-gold-500/30 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gold-500/15 border border-gold-500/40 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4 text-gold-400" />
            </div>
            <div className="min-w-0">
              <span className="text-xs text-ivory-100 font-medium block truncate">{adminEmail}</span>
              <span className="text-[10px] text-gold-400 font-mono uppercase tracking-widest block">&bull; Master Admin &bull;</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-maroon-900/70 hover:bg-maroon-800 text-ivory-100 border border-maroon-700/50 text-xs font-semibold uppercase tracking-wider transition-all active:scale-95 shadow-lg"
          >
            <LogOut className="w-4 h-4 text-red-300" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
