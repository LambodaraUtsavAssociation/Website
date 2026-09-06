'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Images, Film, Sparkles, Upload, Layers } from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import { AdminOverviewStats, Memory } from '@/types';
import { getAdminOverviewStats, getMemories } from '@/lib/data/repository';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [recentMemories, setRecentMemories] = useState<Memory[]>([]);

  useEffect(() => {
    async function loadStats() {
      const data = await getAdminOverviewStats();
      setStats(data);

      const mems = await getMemories({ onlyPublished: false });
      setRecentMemories(mems.slice(0, 6));
    }
    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-charcoal-950 flex flex-col">
      <AdminHeader />

      <div className="flex-1 flex flex-col md:flex-row">
        <AdminSidebar />

        {/* FULL SCREEN WIDTH MAIN CONTENT AREA */}
        <main className="flex-1 p-4 sm:p-6 lg:p-10 w-full max-w-full">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-charcoal-800 gap-4">
            <div>
              <h1 className="font-editorial text-2xl sm:text-4xl lg:text-5xl text-ivory-50 font-normal">
                Dashboard Overview
              </h1>
              <p className="text-xs sm:text-sm text-ivory-300/80 mt-1 font-sans">
                Real-time control panel for Lambodara Utsav Association (Papi Reddy Palli) digital memories, ritual photo galleries, and video archives.
              </p>
            </div>

            <Link
              href="/admin/memories"
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-gradient-to-r from-saffron-700 via-saffron-600 to-saffron-700 border-b-2 border-gold-400 text-ivory-50 text-xs font-semibold uppercase tracking-[0.15em] shadow-glow-saffron transition-all active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Batch Upload Media</span>
            </Link>
          </div>

          {/* Fully Responsive Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 mb-8 sm:mb-10">
            <div className="p-5 sm:p-6 rounded-2xl border-l-2 border-gold-500/60 bg-charcoal-900/80 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ivory-400">Total Years</span>
                <Calendar className="w-4 h-4 text-gold-400" />
              </div>
              <span className="font-editorial text-3xl sm:text-4xl text-ivory-50 font-semibold block">
                {stats?.totalYears ?? 1}
              </span>
              <span className="text-[10px] text-ivory-500 block mt-1">Archived Festival Eras</span>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl border-l-2 border-gold-500/60 bg-charcoal-900/80 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ivory-400">Total Memories</span>
                <Layers className="w-4 h-4 text-gold-400" />
              </div>
              <span className="font-editorial text-3xl sm:text-4xl text-ivory-50 font-semibold block">
                {stats?.totalMemories ?? 7}
              </span>
              <span className="text-[10px] text-ivory-500 block mt-1">Photos &amp; Video Clips</span>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl border-l-2 border-gold-500/60 bg-charcoal-900/80 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ivory-400">Total Photos</span>
                <Images className="w-4 h-4 text-gold-400" />
              </div>
              <span className="font-editorial text-3xl sm:text-4xl text-ivory-50 font-semibold block">
                {stats?.totalPhotos ?? 6}
              </span>
              <span className="text-[10px] text-ivory-500 block mt-1">High-Res Ritual Imagery</span>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl border-l-2 border-gold-500/60 bg-charcoal-900/80 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ivory-400">Total Films</span>
                <Film className="w-4 h-4 text-gold-400" />
              </div>
              <span className="font-editorial text-3xl sm:text-4xl text-ivory-50 font-semibold block">
                {stats?.totalVideos ?? 1}
              </span>
              <span className="text-[10px] text-ivory-500 block mt-1">Cinematic Video Footage</span>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl border-l-2 border-gold-400 bg-charcoal-900/80 shadow-xl col-span-1 sm:col-span-2 md:col-span-1">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-400">2026 Count</span>
                <Sparkles className="w-4 h-4 text-gold-400" />
              </div>
              <span className="font-editorial text-3xl sm:text-4xl text-gold-300 font-semibold block">
                {stats?.currentYearMemories ?? 7}
              </span>
              <span className="text-[10px] text-gold-400/70 block mt-1">Inaugural Celebration</span>
            </div>
          </div>

          {/* Recent Uploads Table / Grid */}
          <div className="p-4 sm:p-8 rounded-3xl border border-charcoal-800 bg-charcoal-900/70 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-charcoal-800 gap-2">
              <div>
                <h2 className="font-editorial text-xl sm:text-2xl text-ivory-50 font-normal">Recent Memory Uploads</h2>
                <p className="text-xs text-ivory-400">Latest media records uploaded to the village digital gallery.</p>
              </div>

              <Link
                href="/admin/memories"
                className="text-xs text-gold-400 hover:text-gold-300 transition-colors uppercase tracking-wider font-semibold"
              >
                View &amp; Manage All ({stats?.totalMemories ?? 7}) &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentMemories.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-charcoal-950/80 border border-charcoal-800 hover:border-gold-500/40 transition-all"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                    <div className="relative w-14 h-12 sm:w-16 sm:h-14 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-charcoal-700">
                      <Image
                        src={m.thumbnail_path || m.storage_path}
                        alt={m.title}
                        fill
                        className="object-cover"
                      />
                      {m.media_type === 'video' && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-[9px] text-gold-300 font-bold uppercase">FILM</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium text-ivory-50 truncate">{m.title}</h4>
                      <p className="text-xs text-ivory-400 flex items-center space-x-2 mt-0.5">
                        <span className="uppercase text-[10px] text-gold-400 font-semibold">{m.media_type}</span>
                        <span>&bull;</span>
                        <span>{m.category?.name || 'General'}</span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      m.is_published ? 'bg-green-900/60 text-green-300 border border-green-700/50' : 'bg-yellow-900/60 text-yellow-300 border border-yellow-700/50'
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
    </div>
  );
}
