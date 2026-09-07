'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Images, Film, Sparkles, Upload, Layers, ChevronRight } from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import AdminMobileBottomBar from '@/components/AdminMobileBottomBar';
import UnifiedUploadDrawer from '@/components/UnifiedUploadDrawer';
import SafeMediaImage from '@/components/SafeMediaImage';
import { getMediaDisplayInfo } from '@/lib/mediaUtils';
import { AdminOverviewStats, Memory } from '@/types';
import { getAdminOverviewStats, getMemories } from '@/lib/data/repository';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [recentMemories, setRecentMemories] = useState<Memory[]>([]);
  const [isUploadDrawerOpen, setIsUploadDrawerOpen] = useState(false);
  const [drawerDefaultTarget, setDrawerDefaultTarget] = useState<'memories' | 'hero'>('memories');

  const loadData = async () => {
    const data = await getAdminOverviewStats();
    setStats(data);

    const mems = await getMemories({ onlyPublished: false });
    setRecentMemories(mems.slice(0, 6));
  };

  useEffect(() => {
    loadData();
  }, []);

  const openUploadDrawer = (target: 'memories' | 'hero' = 'memories') => {
    setDrawerDefaultTarget(target);
    setIsUploadDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 pb-20 md:pb-0">
      <AdminHeader />

      <div className="flex-1 flex flex-col md:flex-row">
        <AdminSidebar />

        {/* FULL SCREEN WIDTH MAIN CONTENT AREA WITH FIXED SIDEBAR OFFSET */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-10 w-full max-w-full md:ml-72 min-h-[calc(100vh-64px)]">
          {/* Header Banner */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-orange-200 gap-3">
            <div className="min-w-0">
              <h1 className="font-editorial text-lg sm:text-2xl text-slate-900 font-bold leading-tight truncate">
                Dashboard Overview
              </h1>
            </div>

            <div className="flex items-center flex-shrink-0">
              <Link
                href="/admin/upload"
                className="inline-flex items-center space-x-1.5 px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-white" />
                <span>Upload</span>
              </Link>
            </div>
          </div>

          {/* Fully Responsive Mobile-First Stats Grid (2 columns on mobile, 5 on desktop) */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <div className="p-3 sm:p-5 rounded-2xl border-2 border-orange-200 bg-white shadow-xs hover:border-orange-400 transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Years</span>
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
              </div>
              <span className="font-editorial text-xl sm:text-3xl text-orange-600 font-bold block">
                {stats?.totalYears ?? 1}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 block mt-0.5 font-medium">Archived Eras</span>
            </div>

            <div className="p-3 sm:p-5 rounded-2xl border-2 border-orange-200 bg-white shadow-xs hover:border-orange-400 transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Memories</span>
                <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
              </div>
              <span className="font-editorial text-xl sm:text-3xl text-orange-600 font-bold block">
                {stats?.totalMemories ?? 7}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 block mt-0.5 font-medium">Total Media</span>
            </div>

            <div className="p-3 sm:p-5 rounded-2xl border-2 border-orange-200 bg-white shadow-xs hover:border-orange-400 transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Photos</span>
                <Images className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
              </div>
              <span className="font-editorial text-xl sm:text-3xl text-orange-600 font-bold block">
                {stats?.totalPhotos ?? 6}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 block mt-0.5 font-medium">Ritual Photos</span>
            </div>

            <div className="p-3 sm:p-5 rounded-2xl border-2 border-orange-200 bg-white shadow-xs hover:border-orange-400 transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Films</span>
                <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
              </div>
              <span className="font-editorial text-xl sm:text-3xl text-orange-600 font-bold block">
                {stats?.totalVideos ?? 1}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 block mt-0.5 font-medium">Video Clips</span>
            </div>

            <div className="p-3 sm:p-5 rounded-2xl border-2 border-orange-400 bg-orange-50/60 shadow-xs hover:border-orange-500 transition-all col-span-2 sm:col-span-2 md:col-span-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-orange-700">2026 Count</span>
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
              </div>
              <span className="font-editorial text-xl sm:text-3xl text-orange-600 font-bold block">
                {stats?.currentYearMemories ?? 7}
              </span>
              <span className="text-[9px] sm:text-[10px] text-orange-700 font-semibold block mt-0.5">Active Festival</span>
            </div>
          </div>

          {/* Recent Uploads Card Container */}
          <div className="p-4 sm:p-8 rounded-3xl border-2 border-orange-200 bg-white shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-orange-100 gap-2">
              <div>
                <h2 className="font-editorial text-lg sm:text-2xl text-slate-900 font-bold">Recent Uploads</h2>
                <p className="text-[11px] sm:text-xs text-slate-600">Latest media records preserved in the gallery.</p>
              </div>

              <Link
                href="/admin/memories"
                className="text-xs text-orange-600 hover:text-orange-700 transition-colors uppercase tracking-wider font-bold flex items-center gap-1"
              >
                <span>View All ({stats?.totalMemories ?? 7})</span>
                <ChevronRight className="w-4 h-4 text-orange-500" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {recentMemories.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-slate-50 border border-orange-200 hover:border-orange-400 transition-all shadow-xs"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                    <div className="relative w-14 h-12 sm:w-16 sm:h-14 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0 border border-orange-200">
                      <SafeMediaImage
                        src={getMediaDisplayInfo(m).url}
                        alt={m.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{m.title}</h4>
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">
                        <span>{m.category?.name || 'General'}</span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex-shrink-0 ml-2 ${
                      m.is_published ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'bg-amber-50 text-amber-700 border border-amber-300'
                    }`}
                  >
                    {m.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Dock for instant mobile access */}
      <AdminMobileBottomBar onOpenUpload={() => openUploadDrawer('memories')} />

      <UnifiedUploadDrawer
        isOpen={isUploadDrawerOpen}
        onClose={() => setIsUploadDrawerOpen(false)}
        onSuccess={loadData}
        defaultTarget={drawerDefaultTarget}
      />
    </div>
  );
}
