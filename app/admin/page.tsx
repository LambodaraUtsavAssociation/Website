'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Images,
  Film,
  Sparkles,
  Upload,
  Layers,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Play,
  Star,
} from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import AdminMobileBottomBar from '@/components/AdminMobileBottomBar';
import SafeMediaImage from '@/components/SafeMediaImage';
import { getMediaDisplayInfo } from '@/lib/mediaUtils';
import { Memory } from '@/types';
import { getAdminOverviewStats, getMemories } from '@/lib/data/repository';
import { toast } from '@/lib/toastStore';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [totalYears, setTotalYears] = useState(1);
  const [allMemories, setAllMemories] = useState<Memory[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const stats = await getAdminOverviewStats();
      setTotalYears(stats?.totalYears || 1);

      const mems = await getMemories({ onlyPublished: false });
      setAllMemories(mems);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalPhotos = allMemories.filter((m) => m.media_type === 'image').length;
  const totalVideos = allMemories.filter((m) => m.media_type === 'video').length;
  const heroSlidesCount = allMemories.filter(
    (m) => m.is_featured && m.media_type === 'image'
  ).length;
  const recentMemories = allMemories.slice(0, 6);

  const handleToggleHero = async (m: Memory, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !m.is_featured;
    try {
      const res = await fetch(`/api/admin/memories/${m.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: nextState }),
      });
      if (res.ok) {
        toast.success(
          nextState ? 'Added to Hero Carousel' : 'Removed from Hero Carousel',
          `"${m.title}" ${nextState ? 'is now live in the homepage hero banner' : 'is now standard gallery only'}.`
        );
        loadData();
      }
    } catch {
      toast.error('Update Failed', 'Could not update hero status.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <AdminHeader />

      <div className="flex-1 flex flex-col md:flex-row">
        <AdminSidebar />

        <main className="flex-1 p-3.5 sm:p-6 lg:p-10 w-full max-w-full md:ml-72 min-h-[calc(100vh-64px)] pb-24 md:pb-8">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-orange-200 gap-2 sm:gap-4">
            <div>
              <h1 className="font-editorial text-2xl sm:text-3xl text-slate-900 font-bold leading-tight">
                Festival Control Center
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">
                One source of truth for festival photos, YouTube videos, and hero banners.
              </p>
            </div>
          </div>

          {/* Infrastructure Health Status Badges */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 mb-5 sm:mb-6 text-[11px] sm:text-xs font-semibold">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cloudflare R2 (Photos) Active</span>
            </div>
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-300 text-red-800">
              <Play className="w-3.5 h-3.5 text-red-600 fill-red-600" />
              <span>YouTube Video Embeds Ready</span>
            </div>
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{heroSlidesCount} Hero Slides Live</span>
            </div>
          </div>

          {/* Top Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 mb-8">
            <Link
              href="/admin/memories"
              className="p-4 sm:p-5 rounded-2xl border-2 border-orange-200 bg-white shadow-xs hover:border-orange-500 transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Total Media
                </span>
                <Layers className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
              </div>
              <span className="font-editorial text-2xl sm:text-4xl text-orange-600 font-bold block">
                {allMemories.length}
              </span>
              <span className="text-[11px] text-slate-500 block mt-1 font-medium">
                All Gallery Items
              </span>
            </Link>

            <Link
              href="/admin/memories?filter=photos"
              className="p-4 sm:p-5 rounded-2xl border-2 border-orange-200 bg-white shadow-xs hover:border-orange-500 transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Photos
                </span>
                <Images className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
              </div>
              <span className="font-editorial text-2xl sm:text-4xl text-orange-600 font-bold block">
                {totalPhotos}
              </span>
              <span className="text-[11px] text-slate-500 block mt-1 font-medium">
                Cloudflare R2 Storage
              </span>
            </Link>

            <Link
              href="/admin/memories?filter=videos"
              className="p-4 sm:p-5 rounded-2xl border-2 border-orange-200 bg-white shadow-xs hover:border-orange-500 transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  YouTube Videos
                </span>
                <Film className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
              </div>
              <span className="font-editorial text-2xl sm:text-4xl text-orange-600 font-bold block">
                {totalVideos}
              </span>
              <span className="text-[11px] text-slate-500 block mt-1 font-medium">
                Zero-Lag Stream
              </span>
            </Link>

            <Link
              href="/admin/hero"
              className="p-4 sm:p-5 rounded-2xl border-2 border-amber-300 bg-amber-50/50 shadow-xs hover:border-amber-500 transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
                  Hero Carousel
                </span>
                <Sparkles className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
              </div>
              <span className="font-editorial text-2xl sm:text-4xl text-amber-700 font-bold block">
                {heroSlidesCount}
              </span>
              <span className="text-[11px] text-amber-800 block mt-1 font-medium">
                Active Banner Slides
              </span>
            </Link>
          </div>

          {/* Fast Navigation Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
            <Link
              href="/admin/upload"
              className="p-4 rounded-2xl bg-white border border-orange-200 hover:border-orange-400 hover:shadow-md transition-all flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                    Upload Photos & Videos
                  </h3>
                  <p className="text-[11px] text-slate-500">Direct to R2 & YouTube embed</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              href="/admin/memories"
              className="p-4 rounded-2xl bg-white border border-orange-200 hover:border-orange-400 hover:shadow-md transition-all flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
                  <Images className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                    Media Library Hub
                  </h3>
                  <p className="text-[11px] text-slate-500">Single source of truth</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              href="/admin/hero"
              className="p-4 rounded-2xl bg-white border border-orange-200 hover:border-orange-400 hover:shadow-md transition-all flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                    Hero Banner Manager
                  </h3>
                  <p className="text-[11px] text-slate-500">Manage live homepage slides</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>

          {/* Recent Media Records with Inline Hero Toggle */}
          <div className="p-4 sm:p-6 rounded-3xl border-2 border-orange-200 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-orange-100">
              <div>
                <h2 className="font-editorial text-lg sm:text-xl text-slate-900 font-bold">
                  Recent Media
                </h2>
                <p className="text-xs text-slate-600">
                  Latest photos & videos saved in your platform.
                </p>
              </div>

              <Link
                href="/admin/memories"
                className="text-xs text-orange-600 hover:text-orange-700 font-bold uppercase tracking-wider flex items-center gap-1"
              >
                <span>View Full Library ({allMemories.length})</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                Loading recent records...
              </div>
            ) : recentMemories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-slate-500 mb-3 font-semibold">No media uploaded yet.</p>
                <Link
                  href="/admin/upload"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold uppercase tracking-wider"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload First Photo or Video</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {recentMemories.map((m) => {
                  const mediaInfo = getMediaDisplayInfo(m);
                  const isVideo = m.media_type === 'video';

                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-orange-200 hover:border-orange-400 transition-all shadow-xs"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0 border border-orange-200">
                          <SafeMediaImage
                            src={mediaInfo.thumbnailUrl || mediaInfo.poster || mediaInfo.url}
                            poster={mediaInfo.poster}
                            alt={m.title}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                          {isVideo && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Play className="w-4 h-4 fill-white text-white" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {m.title}
                          </h4>
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-500 font-medium truncate">
                              {m.category?.name || 'Festival Chapter'}
                            </span>
                            <span className="text-[10px] text-slate-400">&bull;</span>
                            <span className="text-[10px] font-bold text-orange-600 uppercase">
                              {isVideo ? 'YouTube' : 'R2 Photo'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action: Hero Toggle Badge */}
                      <div className="flex items-center space-x-1.5 ml-2 flex-shrink-0">
                        {!isVideo && (
                          <button
                            onClick={(e) => handleToggleHero(m, e)}
                            title={
                              m.is_featured
                                ? 'Click to remove from Hero Carousel'
                                : 'Click to feature in Hero Carousel'
                            }
                            className={`p-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all flex items-center space-x-1 cursor-pointer ${
                              m.is_featured
                                ? 'bg-amber-100 border-amber-400 text-amber-800 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-400 hover:border-amber-400 hover:text-amber-600'
                            }`}
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${m.is_featured ? 'fill-amber-500 text-amber-500' : ''}`}
                            />
                            <span className="hidden sm:inline">
                              {m.is_featured ? 'Hero' : 'Pin'}
                            </span>
                          </button>
                        )}

                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            m.is_published
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                              : 'bg-amber-50 text-amber-700 border border-amber-300'
                          }`}
                        >
                          {m.is_published ? 'Live' : 'Draft'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      <AdminMobileBottomBar />
    </div>
  );
}
