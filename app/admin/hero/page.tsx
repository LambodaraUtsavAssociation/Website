'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ExternalLink,
  Plus,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Camera,
  CheckCircle2,
  Layers,
  Images,
} from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import AdminMobileBottomBar from '@/components/AdminMobileBottomBar';
import SafeMediaImage from '@/components/SafeMediaImage';
import EmptyState from '@/components/EmptyState';
import { toast } from '@/lib/toastStore';
import { Memory } from '@/types';
import { getMemories } from '@/lib/data/repository';

export default function AdminHeroPage() {
  const [heroMemories, setHeroMemories] = useState<Memory[]>([]);
  const [allMemories, setAllMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const all = await getMemories({ onlyPublished: false });
      setAllMemories(all);
      const featured = all.filter((m) => m.is_featured && m.media_type === 'image');
      setHeroMemories(featured);
    } catch (err) {
      console.error('Failed to load hero memories:', err);
      toast.error('Load Error', 'Could not fetch hero carousel slides.');
    } finally {
      setLoading(false);
    }
  }

  // Remove photo from Hero Carousel
  const handleRemoveFromHero = async (m: Memory) => {
    // Optimistic UI update
    setHeroMemories((prev) => prev.filter((item) => item.id !== m.id));
    setAllMemories((prev) =>
      prev.map((item) => (item.id === m.id ? { ...item, is_featured: false } : item))
    );

    try {
      const res = await fetch(`/api/admin/memories/${m.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: false }),
      });
      if (res.ok) {
        toast.info(
          'Removed from Hero',
          `"${m.title}" was removed from the hero carousel. It remains in your Media Library.`
        );
      } else {
        throw new Error('Update failed');
      }
    } catch {
      toast.error('Update Failed', 'Could not update hero status.');
      loadData();
    }
  };

  // Add photo to Hero Carousel from Picker Modal
  const handleAddToHero = async (m: Memory) => {
    // Optimistic UI update
    setHeroMemories((prev) => [...prev, { ...m, is_featured: true }]);
    setAllMemories((prev) =>
      prev.map((item) => (item.id === m.id ? { ...item, is_featured: true } : item))
    );

    try {
      const res = await fetch(`/api/admin/memories/${m.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: true }),
      });
      if (res.ok) {
        toast.success(
          '🌟 Added to Hero Banner',
          `"${m.title}" is now active in the homepage hero carousel.`
        );
      } else {
        throw new Error('Update failed');
      }
    } catch {
      toast.error('Update Failed', 'Could not add to hero carousel.');
      loadData();
    }
  };

  // Toggle Visibility (Published / Draft)
  const handleTogglePublish = async (m: Memory) => {
    const nextState = !m.is_published;
    setHeroMemories((prev) =>
      prev.map((item) => (item.id === m.id ? { ...item, is_published: nextState } : item))
    );

    try {
      const res = await fetch(`/api/admin/memories/${m.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: nextState }),
      });
      if (res.ok) {
        toast.info('Visibility Changed', `"${m.title}" is now ${nextState ? 'Active' : 'Hidden'}.`);
      } else {
        throw new Error('Update failed');
      }
    } catch {
      toast.error('Update Failed', 'Could not toggle slide visibility.');
      loadData();
    }
  };

  // Move slide position (up or down)
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= heroMemories.length) return;

    const reordered = [...heroMemories];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    setHeroMemories(reordered);

    // Save order
    const orderedIds = reordered.map((m) => m.id);
    try {
      await fetch('/api/admin/memories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      toast.success('Order Updated', `Moved slide #${index + 1} to #${targetIndex + 1}.`);
    } catch {
      toast.error('Reorder Failed', 'Could not save slide order.');
    }
  };

  // Drag and drop reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData('text/plain');
    if (!sourceIndexStr) return;

    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

    const reordered = [...heroMemories];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setHeroMemories(reordered);

    const orderedIds = reordered.map((m) => m.id);
    try {
      await fetch('/api/admin/memories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      toast.success('Sequence Reordered', `Slide moved to position #${targetIndex + 1}.`);
    } catch {
      toast.error('Reorder Failed', 'Could not save sequence.');
    }
  };

  // Available library photos not yet in hero
  const unfeaturedPhotos = allMemories.filter((m) => m.media_type === 'image' && !m.is_featured);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 pb-20 md:pb-0">
      <AdminHeader />

      <div className="flex-1 flex flex-col md:flex-row">
        <AdminSidebar />

        <main className="flex-1 p-3.5 sm:p-6 lg:p-10 pb-24 md:pb-8 w-full max-w-full md:ml-72 min-h-[calc(100vh-64px)]">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-orange-200 gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-editorial text-2xl sm:text-3xl text-slate-900 font-bold">
                  Homepage Hero Carousel
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-amber-600 fill-amber-600" />
                  <span>{heroMemories.length} Active Slides</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Single source of truth: Select any photo from your Media Library to rotate on the
                homepage hero section.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                <Layers className="w-4 h-4 text-orange-600" />
                <span>Choose from Library</span>
              </button>

              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs"
                title="Preview live homepage in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Preview Live</span>
              </a>
            </div>
          </div>

          {/* Explainer Callout Card */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-amber-600 fill-amber-600" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                  Dual-Display Hero Architecture
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  Slides automatically rotate every 5 seconds on the homepage. If no custom photos
                  are featured, the website gracefully presents the built-in sacred temple visuals.
                </p>
              </div>
            </div>
            <Link
              href="/admin/memories?filter=photos"
              className="text-xs font-bold text-amber-900 hover:underline flex-shrink-0"
            >
              View All Photos in Media Library &rarr;
            </Link>
          </div>

          {/* Hero Slides Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs text-slate-500 font-medium">Loading hero slides...</p>
            </div>
          ) : heroMemories.length > 0 ? (
            <div className="space-y-3.5">
              {heroMemories.map((m, index) => {
                const displayTitle = m.title || `Hero Slide #${index + 1}`;
                const photoUrl = m.thumbnail_path || m.storage_path;

                return (
                  <div
                    key={m.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, index)}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-amber-400 transition-all shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                  >
                    {/* Left: Drag Handle, Slide Number, Thumbnail, and Title */}
                    <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                      {/* Drag Handle */}
                      <div className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-grab flex-shrink-0">
                        <GripVertical className="w-4 h-4" />
                      </div>

                      {/* Position Number Pill */}
                      <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-300 text-slate-800 text-xs font-extrabold flex items-center justify-center flex-shrink-0">
                        #{index + 1}
                      </div>

                      {/* 16:9 Thumbnail */}
                      <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0 border border-slate-200">
                        <SafeMediaImage
                          src={photoUrl}
                          alt={displayTitle}
                          fill
                          className="object-cover"
                          sizes="100px"
                        />
                      </div>

                      {/* Title & Info */}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-editorial text-sm sm:text-base font-bold text-slate-900 truncate">
                          {displayTitle}
                        </h4>
                        {m.telugu_title && (
                          <p className="text-xs text-orange-700 font-medium truncate mt-0.5">
                            {m.telugu_title}
                          </p>
                        )}
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-medium mt-1">
                          <span>{m.category?.name || 'General'}</span>
                          <span>&bull;</span>
                          <span>{m.capture_date || '2026'}</span>
                          <span>&bull;</span>
                          <span className="text-blue-600 font-semibold">Cloudflare R2</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Order Arrows & Action Buttons */}
                    <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
                      {/* Move Up/Down Controls */}
                      <div className="flex items-center space-x-1 border-r border-slate-200 pr-2">
                        <button
                          type="button"
                          onClick={() => handleMoveOrder(index, 'up')}
                          disabled={index === 0}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                          title="Move Slide Earlier"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveOrder(index, 'down')}
                          disabled={index === heroMemories.length - 1}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                          title="Move Slide Later"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Publish / Draft Toggle */}
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(m)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 ${
                          m.is_published
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                        }`}
                        title="Toggle Slide Visibility"
                      >
                        {m.is_published ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                            <span>Hidden</span>
                          </>
                        )}
                      </button>

                      {/* Remove from Hero Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveFromHero(m)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove from Hero Carousel (Keeps photo in Media Library)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No Custom Hero Slides Selected"
              description="Your homepage hero is currently showing the default inaugural temple visuals. You can add any photo from your Media Library to appear here."
              actionText="Choose Photos from Library"
              onAction={() => setIsPickerOpen(true)}
              badge="Hero Carousel"
              lightMode={true}
            />
          )}

          {/* Quick Picker Modal: Add Photos from Media Library */}
          {isPickerOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in">
              <div className="w-full max-w-2xl p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-orange-300 bg-white shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-editorial text-xl font-bold text-slate-900">
                      Add Photos to Hero Carousel
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Select any photo from your library to feature on the homepage banner.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPickerOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  >
                    &times;
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {unfeaturedPhotos.length > 0 ? (
                    unfeaturedPhotos.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl border border-slate-200 hover:border-orange-400 bg-slate-50/50 flex items-center justify-between gap-3 transition-all"
                      >
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className="relative w-16 h-12 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0">
                            <SafeMediaImage
                              src={item.thumbnail_path || item.storage_path}
                              alt={item.title}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {item.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-medium truncate">
                              {item.category?.name || 'General'} &bull;{' '}
                              {item.capture_date || '2026'}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddToHero(item)}
                          className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer flex-shrink-0 shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Feature in Hero</span>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-slate-500 text-xs">
                      All existing photos in your Media Library are already featured in the Hero
                      Carousel!
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setIsPickerOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <AdminMobileBottomBar />
    </div>
  );
}
