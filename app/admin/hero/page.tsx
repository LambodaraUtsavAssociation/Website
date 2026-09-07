'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Edit2,
  Trash2,
  GripVertical,
  Sparkles,
  X,
  ExternalLink,
  Eye,
  EyeOff,
  Images,
  Film,
} from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import AdminMobileBottomBar from '@/components/AdminMobileBottomBar';
import UnifiedUploadDrawer from '@/components/UnifiedUploadDrawer';
import SafeMediaImage from '@/components/SafeMediaImage';
import EmptyState from '@/components/EmptyState';
import { toast } from '@/lib/toastStore';
import { getHeroBucketMedia } from '@/lib/data/repository';

interface HeroSlideItem {
  url: string;
  caption: string;
  alt: string;
  isVideo?: boolean;
  isPublished?: boolean;
}

export default function AdminHeroPage() {
  const [slides, setSlides] = useState<HeroSlideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlide, setEditingSlide] = useState<HeroSlideItem | null>(null);
  const [isUploadDrawerOpen, setIsUploadDrawerOpen] = useState(false);


  useEffect(() => {
    loadSlides();
  }, []);

  async function saveHeroState(updatedSlides: HeroSlideItem[]) {
    setSlides(updatedSlides);
    try {
      await fetch('/api/admin/hero/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides: updatedSlides }),
      });
    } catch (err) {
      console.error('Failed to save hero metadata:', err);
    }
  }

  async function loadSlides() {
    setLoading(true);
    try {
      const res = await fetch('/api/hero-media?all=true', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.items) {
          setSlides(data.items);
        }
      }
    } catch (err) {
      console.error('Failed to load hero slides:', err);
    } finally {
      setLoading(false);
    }
  }

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

    const reordered = [...slides];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    await saveHeroState(reordered);
    toast.success('Sequence Reordered', `Moved slide "${moved.caption}" to position #${targetIndex + 1}.`);
  };

  const handleTogglePublish = async (item: HeroSlideItem) => {
    const nextState = !(item.isPublished !== false);
    const updated = slides.map((s) => (s.url === item.url ? { ...s, isPublished: nextState } : s));
    await saveHeroState(updated);
    toast.info('Slide Visibility Updated', `"${item.caption}" is now ${nextState ? 'Active' : 'Hidden'}.`);
  };

  const handleDeleteSlide = async (item: HeroSlideItem) => {
    if (!confirm(`Are you sure you want to remove "${item.caption}" from the Hero Section?`)) return;

    // Optimistically update UI
    setSlides((prev) => prev.filter((s) => s.url !== item.url));

    try {
      const res = await fetch('/api/admin/hero/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: item.url }),
      });

      const result = await res.json();
      if (!res.ok || result.error) {
        throw new Error(result.error || 'Failed to delete file');
      }

      toast.success('Hero Slide Deleted', `Removed "${item.caption}" from Hero Section.`);
      await loadSlides();
    } catch (err: any) {
      await loadSlides();
      toast.error('Deletion Failed', err.message || 'Could not delete hero slide.');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide) return;

    const updated = slides.map((s) => (s.url === editingSlide.url ? editingSlide : s));
    await saveHeroState(updated);
    toast.success('Changes Saved', `Updated caption for "${editingSlide.caption}".`);
    setEditingSlide(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 pb-20 md:pb-0">
      <AdminHeader />

      <div className="flex-1 flex flex-col md:flex-row">
        <AdminSidebar />

        {/* FULL SCREEN WIDTH MAIN CONTENT AREA WITH RESPONSIVE PADDING & FIXED SIDEBAR OFFSET */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-10 w-full max-w-full md:ml-72 min-h-[calc(100vh-64px)]">
          {/* Clean Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-orange-200">
            <h1 className="font-editorial text-lg sm:text-2xl text-slate-900 font-bold">
              Hero Banner Media
            </h1>
            <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider flex items-center gap-1 flex-shrink-0">
              <Sparkles className="w-3 h-3 text-orange-600" />
              <span>{slides.length} Items</span>
            </span>
          </div>

          {/* Reorderable Hero Slide Cards in 2 Columns Grid */}
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-500">Loading live hero slides...</div>
          ) : slides.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {slides.map((item, index) => {
                const isVideo = item.isVideo || /\.(mp4|webm|ogg|mov|m4v)$/i.test(item.url);
                const displayTitle =
                  !item.caption || /^[0-9\s_a-f-]+$/i.test(item.caption.trim()) || item.caption.includes('http')
                    ? `Hero Media #${index + 1}`
                    : item.caption;

                return (
                  <div
                    key={item.url + index}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, index)}
                    className="p-3 sm:p-5 rounded-2xl border-2 border-orange-200/90 hover:border-orange-500 bg-white flex flex-col justify-between cursor-move transition-all shadow-xs group"
                  >
                    {/* Top: Thumbnail Aspect Box + Drag Handle & Badges */}
                    <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-slate-100 mb-2.5">
                      {isVideo ? (
                        <video src={item.url} className="w-full h-full object-cover" />
                      ) : (
                        <SafeMediaImage
                          src={item.url}
                          alt={displayTitle}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 33vw"
                        />
                      )}

                      {/* Drag Handle Top Left */}
                      <div className="absolute top-1.5 left-1.5 p-1 rounded-lg bg-black/60 text-white backdrop-blur-xs cursor-grab">
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>

                      {/* Type Badge Bottom Left */}
                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[8px] font-extrabold text-white uppercase tracking-wider">
                        {isVideo ? 'FILM' : 'PHOTO'}
                      </span>

                      {/* Sequence Badge Top Right */}
                      <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-orange-600 text-white text-[9px] font-extrabold shadow-xs">
                        #{index + 1}
                      </span>
                    </div>

                    {/* Middle: Title & Subtitle */}
                    <div className="min-w-0 mb-2">
                      <h4 className="text-xs sm:text-lg font-editorial font-bold text-slate-900 truncate">
                        {displayTitle}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate mt-0.5">
                        {isVideo ? 'Cinematic Video Clip' : 'Ritual Photo Banner'}
                      </p>
                    </div>

                    {/* Bottom: Status & Borderless Action Buttons */}
                    <div className="flex items-center justify-between pt-2.5 sm:pt-3 border-t border-slate-100 gap-1">
                      <span
                        className={`px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider ${
                          item.isPublished !== false
                            ? 'bg-emerald-100/70 text-emerald-800'
                            : 'bg-amber-100/70 text-amber-800'
                        }`}
                      >
                        {item.isPublished !== false ? 'Published' : 'Draft'}
                      </span>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleTogglePublish(item)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                          title={item.isPublished !== false ? 'Hide Slide' : 'Publish Slide'}
                        >
                          {item.isPublished !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => setEditingSlide(item)}
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 transition-colors"
                          title="Edit Slide Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteSlide(item)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                          title="Delete Hero Slide"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No Custom Hero Slides Uploaded"
              description="High-definition photos or video films uploaded from the dashboard will be displayed here."
              lightMode={true}
            />
          )}

          {/* Edit Slide Modal */}
          {editingSlide && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white border-2 border-orange-500 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-orange-100">
                  <h3 className="font-editorial text-xl text-slate-900 font-bold">Edit Hero Slide</h3>
                  <button
                    onClick={() => setEditingSlide(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveEdit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-orange-700 uppercase tracking-wider block mb-1.5">
                      Slide Title / Caption
                    </label>
                    <input
                      type="text"
                      value={editingSlide.caption}
                      onChange={(e) => setEditingSlide({ ...editingSlide, caption: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm font-semibold focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-orange-700 uppercase tracking-wider block mb-1.5">
                      Alt Description (Accessibility)
                    </label>
                    <textarea
                      rows={3}
                      value={editingSlide.alt}
                      onChange={(e) => setEditingSlide({ ...editingSlide, alt: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm font-semibold focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingSlide(null)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold uppercase tracking-wider hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider shadow-md"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      <AdminMobileBottomBar onOpenUpload={() => setIsUploadDrawerOpen(true)} />

      <UnifiedUploadDrawer
        isOpen={isUploadDrawerOpen}
        onClose={() => setIsUploadDrawerOpen(false)}
        onSuccess={loadSlides}
        defaultTarget="hero"
      />
    </div>
  );
}

