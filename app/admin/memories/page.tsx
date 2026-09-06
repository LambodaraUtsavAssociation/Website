'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Upload,
  Edit2,
  Trash2,
  GripVertical,
  Sparkles,
  X,
  Filter,
} from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import MediaUploader from '@/components/MediaUploader';
import { Memory, FestivalYear, Category } from '@/types';
import { getMemories, getFestivalYears, getCategories } from '@/lib/data/repository';

export default function AdminMemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [years, setYears] = useState<FestivalYear[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showUploader, setShowUploader] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);

  // Filter State
  const [selectedYearId, setSelectedYearId] = useState<string>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const yrs = await getFestivalYears(false);
    setYears(yrs);

    const cats = await getCategories();
    setCategories(cats);

    const mems = await getMemories({ onlyPublished: false });
    setMemories(mems);
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData('text/plain');
    if (!sourceIndexStr) return;

    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

    const reordered = [...memories];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    setMemories(reordered);

    // Persist new display_order to backend
    const orderedIds = reordered.map((m) => m.id);
    await fetch('/api/admin/memories/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds }),
    });
  };

  const handleTogglePublish = async (m: Memory) => {
    await fetch(`/api/admin/memories/${m.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !m.is_published }),
    });
    loadData();
  };

  const handleToggleFeatured = async (m: Memory) => {
    await fetch(`/api/admin/memories/${m.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_featured: !m.is_featured }),
    });
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this memory?')) return;
    await fetch(`/api/admin/memories/${id}`, { method: 'DELETE' });
    loadData();
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMemory) return;

    await fetch(`/api/admin/memories/${editingMemory.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editingMemory.title,
        description: editingMemory.description,
        category_id: editingMemory.category_id,
        festival_year_id: editingMemory.festival_year_id,
        is_featured: editingMemory.is_featured,
        is_published: editingMemory.is_published,
      }),
    });

    setEditingMemory(null);
    loadData();
  };

  const filteredMemories = memories.filter((m) => {
    const matchYear = selectedYearId === 'all' || m.festival_year_id === selectedYearId;
    const matchCat = selectedCategoryId === 'all' || m.category_id === selectedCategoryId;
    return matchYear && matchCat;
  });

  return (
    <div className="min-h-screen bg-charcoal-950 flex flex-col">
      <AdminHeader />

      <div className="flex-1 flex flex-col md:flex-row">
        <AdminSidebar />

        {/* FULL SCREEN WIDTH MAIN CONTENT AREA WITH RESPONSIVE PADDING */}
        <main className="flex-1 p-4 sm:p-6 lg:p-10 w-full max-w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-charcoal-800 gap-4">
            <div>
              <h1 className="font-editorial text-2xl sm:text-4xl text-ivory-50 font-normal">
                Media Memories &amp; Ordering
              </h1>
              <p className="text-xs sm:text-sm text-ivory-300/80 mt-1 font-sans">
                Upload photos and films, reorder by dragging handles, and toggle featured highlights.
              </p>
            </div>

            <button
              onClick={() => setShowUploader(!showUploader)}
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-gradient-to-r from-saffron-700 via-saffron-600 to-saffron-700 border-b-2 border-gold-400 text-ivory-50 text-xs font-semibold uppercase tracking-[0.15em] shadow-glow-saffron transition-all active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>{showUploader ? 'Close Uploader' : 'Batch Upload Media'}</span>
            </button>
          </div>

          {/* Collapsible Batch Uploader Section */}
          {showUploader && (
            <div className="mb-8 p-4 sm:p-8 rounded-3xl border border-gold-500/30 bg-charcoal-900/90 shadow-2xl animate-fade-in">
              <h3 className="font-editorial text-xl sm:text-2xl text-ivory-50 mb-4">Batch Media Uploader</h3>
              <MediaUploader
                years={years}
                categories={categories}
                onUploadSuccess={() => {
                  loadData();
                }}
              />
            </div>
          )}

          {/* Responsive Filters Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 rounded-2xl border border-charcoal-800 bg-charcoal-900/80 text-xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center space-x-1.5 text-gold-400 font-semibold uppercase tracking-wider">
                <Filter className="w-3.5 h-3.5" />
                <span>Filters:</span>
              </div>

              <select
                value={selectedYearId}
                onChange={(e) => setSelectedYearId(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-gold-300 text-xs uppercase tracking-wider focus:outline-none focus:border-gold-400 cursor-pointer"
              >
                <option value="all">All Festival Years</option>
                {years.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.year} - {y.title}
                  </option>
                ))}
              </select>

              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-gold-300 text-xs uppercase tracking-wider focus:outline-none focus:border-gold-400 cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-ivory-400 text-xs uppercase tracking-wider">
              Showing {filteredMemories.length} of {memories.length} memories
            </span>
          </div>

          {/* Reorderable Memory List with Mobile Responsiveness */}
          <div className="space-y-3">
            {filteredMemories.map((m, index) => (
              <div
                key={m.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, index)}
                className="p-4 rounded-2xl border border-charcoal-800 bg-charcoal-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-move hover:border-gold-500/40 transition-colors shadow-lg"
              >
                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                  {/* Drag Handle */}
                  <div className="text-ivory-500 hover:text-gold-400 flex-shrink-0 cursor-grab">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {/* Thumbnail */}
                  <div className="relative w-16 h-14 sm:w-20 sm:h-16 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-charcoal-700">
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

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h4 className="text-sm sm:text-base font-medium text-ivory-50 truncate">{m.title}</h4>
                      {m.is_featured && (
                        <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-saffron-600/80 text-[9px] font-semibold uppercase text-ivory-50 border border-gold-400/40">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ivory-400 flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-gold-400 font-semibold uppercase text-[10px]">{m.media_type}</span>
                      <span>&bull;</span>
                      <span>{m.category?.name || 'General'}</span>
                      <span>&bull;</span>
                      <span>{m.capture_date || '2026'}</span>
                    </p>
                  </div>
                </div>

                {/* Responsive Actions */}
                <div className="flex items-center justify-between sm:justify-end space-x-2.5 sm:space-x-3 flex-shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-charcoal-800">
                  <button
                    onClick={() => handleToggleFeatured(m)}
                    title="Toggle Featured Highlight"
                    className={`p-2 sm:p-2.5 rounded-xl text-xs transition-colors ${
                      m.is_featured ? 'bg-gold-500/20 text-gold-400 border border-gold-500/40' : 'bg-charcoal-800 text-ivory-400 hover:text-ivory-200'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleTogglePublish(m)}
                    className={`px-3 sm:px-3.5 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      m.is_published ? 'bg-green-900/60 text-green-300 border border-green-700/50' : 'bg-yellow-900/60 text-yellow-300 border border-yellow-700/50'
                    }`}
                  >
                    {m.is_published ? 'Published' : 'Draft'}
                  </button>

                  <button
                    onClick={() => setEditingMemory(m)}
                    className="p-2 sm:p-2.5 rounded-xl bg-charcoal-800 text-ivory-300 hover:text-gold-400 border border-charcoal-700"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-2 sm:p-2.5 rounded-xl bg-maroon-900/60 text-red-300 hover:text-red-200 border border-maroon-700/50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Edit Memory Modal */}
          {editingMemory && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
              <div className="w-full max-w-lg p-5 sm:p-8 rounded-3xl border border-gold-500/40 bg-charcoal-900 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-auto">
                <div className="flex items-center justify-between pb-4 border-b border-charcoal-800">
                  <h3 className="font-editorial text-xl sm:text-2xl text-ivory-50">Edit Memory Details</h3>
                  <button onClick={() => setEditingMemory(null)} className="text-ivory-400 hover:text-ivory-100">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveEdit} className="space-y-4">
                  <div>
                    <label className="text-[11px] text-gold-400 uppercase tracking-wider block mb-1 font-semibold">
                      Title
                    </label>
                    <input
                      type="text"
                      required
                      value={editingMemory.title}
                      onChange={(e) => setEditingMemory({ ...editingMemory, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-xs text-ivory-50 focus:outline-none focus:border-gold-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-gold-400 uppercase tracking-wider block mb-1 font-semibold">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={editingMemory.description || ''}
                      onChange={(e) => setEditingMemory({ ...editingMemory, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-xs text-ivory-50 focus:outline-none focus:border-gold-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] text-gold-400 uppercase tracking-wider block mb-1 font-semibold">
                        Category
                      </label>
                      <select
                        value={editingMemory.category_id || ''}
                        onChange={(e) => setEditingMemory({ ...editingMemory, category_id: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-xs text-ivory-50 focus:outline-none focus:border-gold-400 cursor-pointer"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-gold-400 uppercase tracking-wider block mb-1 font-semibold">
                        Festival Year
                      </label>
                      <select
                        value={editingMemory.festival_year_id}
                        onChange={(e) => setEditingMemory({ ...editingMemory, festival_year_id: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-xs text-ivory-50 focus:outline-none focus:border-gold-400 cursor-pointer"
                      >
                        {years.map((y) => (
                          <option key={y.id} value={y.id}>
                            {y.year} - {y.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 pt-2">
                    <label className="flex items-center space-x-2 text-xs text-ivory-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingMemory.is_featured}
                        onChange={(e) => setEditingMemory({ ...editingMemory, is_featured: e.target.checked })}
                        className="rounded border-charcoal-700 text-saffron-600 focus:ring-0"
                      />
                      <span>Featured Memory</span>
                    </label>

                    <label className="flex items-center space-x-2 text-xs text-ivory-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingMemory.is_published}
                        onChange={(e) => setEditingMemory({ ...editingMemory, is_published: e.target.checked })}
                        className="rounded border-charcoal-700 text-saffron-600 focus:ring-0"
                      />
                      <span>Published State</span>
                    </label>
                  </div>

                  <div className="pt-4 flex items-center justify-end space-x-3 border-t border-charcoal-800">
                    <button
                      type="button"
                      onClick={() => setEditingMemory(null)}
                      className="px-5 py-2.5 rounded-full border border-charcoal-700 text-xs text-ivory-300 hover:text-ivory-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-full bg-saffron-600 hover:bg-saffron-500 text-ivory-50 text-xs font-medium uppercase tracking-wider"
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
    </div>
  );
}
