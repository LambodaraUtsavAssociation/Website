'use client';

import { useState, useEffect } from 'react';
import {
  Edit2,
  Trash2,
  GripVertical,
  Sparkles,
  Camera,
  X,
  Filter,
} from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import AdminMobileBottomBar from '@/components/AdminMobileBottomBar';
import UnifiedUploadDrawer from '@/components/UnifiedUploadDrawer';
import SafeMediaImage from '@/components/SafeMediaImage';
import EmptyState from '@/components/EmptyState';
import { getMediaDisplayInfo } from '@/lib/mediaUtils';
import { toast } from '@/lib/toastStore';
import { Memory, FestivalYear, Category } from '@/types';
import { getMemories, getFestivalYears, getCategories } from '@/lib/data/repository';
import CustomDropdown, { DropdownOption } from '@/components/CustomDropdown';

export default function AdminMemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [years, setYears] = useState<FestivalYear[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [isUploadDrawerOpen, setIsUploadDrawerOpen] = useState(false);

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

    toast.success('Sequence Reordered', `Moved "${moved.title}" to position #${targetIndex + 1}.`);
  };

  const handleTogglePublish = async (m: Memory) => {
    const nextState = !m.is_published;
    await fetch(`/api/admin/memories/${m.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: nextState }),
    });
    toast.info('Publication Updated', `"${m.title}" is now ${nextState ? 'Published' : 'Draft'}.`);
    loadData();
  };

  const handleToggleFeatured = async (m: Memory) => {
    const nextState = !m.is_featured;
    await fetch(`/api/admin/memories/${m.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_featured: nextState }),
    });
    toast.info('Highlight State Updated', `"${m.title}" ${nextState ? 'marked as Featured' : 'unmarked'}.`);
    loadData();
  };

  const handleDelete = async (m: Memory) => {
    if (!confirm(`Are you sure you want to delete "${m.title}"?`)) return;
    await fetch(`/api/admin/memories/${m.id}`, { method: 'DELETE' });
    toast.success('Memory Deleted', `Successfully removed "${m.title}".`);
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
        thumbnail_path: editingMemory.thumbnail_path,
        is_featured: editingMemory.is_featured,
        is_published: editingMemory.is_published,
      }),
    });

    toast.success('Changes Saved', `Updated details for "${editingMemory.title}".`);
    setEditingMemory(null);
    loadData();
  };

  const adminYearOptions: DropdownOption[] = [
    { value: 'all', label: 'All Festival Years', count: memories.length },
    ...years.map((y) => ({
      value: y.id,
      label: `${y.year} - ${y.title}`,
      count: memories.filter((m) => m.festival_year_id === y.id).length,
    })),
  ];

  // Category options scoped to the currently selected year (or all memories if all years selected)
  const yearScopedMemories = selectedYearId === 'all'
    ? memories
    : memories.filter((m) => m.festival_year_id === selectedYearId);

  const adminCategoryOptions: DropdownOption[] = [
    { value: 'all', label: 'All Categories', count: yearScopedMemories.length },
    ...categories.map((c) => ({
      value: c.id,
      label: c.name,
      count: yearScopedMemories.filter((m) => m.category_id === c.id).length,
    })),
  ];

  const singleFilterOptions: DropdownOption[] = [
    { value: 'all', label: 'All Memories', displayLabel: 'All Memories', count: memories.length },
  ];

  years.forEach((y) => {
    const yearMemories = memories.filter((m) => m.festival_year_id === y.id);
    
    // Step 1: Select Year (Header / Main Year Entry)
    singleFilterOptions.push({
      value: `year:${y.id}`,
      label: `${y.year} - ${y.title}`,
      displayLabel: `${y.year} - ${y.title}`,
      count: yearMemories.length,
      isGroupHeader: true,
    });

    // Step 2: All Memories for Year Option
    singleFilterOptions.push({
      value: `year:${y.id}:cat:all`,
      label: `└ All ${y.year} Memories`,
      displayLabel: `All ${y.year} Memories`,
      count: yearMemories.length,
      indent: true,
    });

    // Step 3: Categories for this Year
    categories.forEach((c) => {
      const catCount = yearMemories.filter((m) => m.category_id === c.id).length;
      if (catCount > 0) {
        singleFilterOptions.push({
          value: `year:${y.id}:cat:${c.id}`,
          label: `└ ${c.name}`,
          displayLabel: `${y.year} • ${c.name}`,
          count: catCount,
          indent: true,
        });
      }
    });
  });

  const selectedFilterValue = (() => {
    if (selectedYearId !== 'all') {
      if (selectedCategoryId !== 'all') {
        return `year:${selectedYearId}:cat:${selectedCategoryId}`;
      }
      return `year:${selectedYearId}`;
    }
    return 'all';
  })();

  const handleSingleFilterChange = (val: string) => {
    if (val === 'all') {
      setSelectedYearId('all');
      setSelectedCategoryId('all');
    } else if (val.startsWith('year:')) {
      const parts = val.split(':');
      const yId = parts[1];
      setSelectedYearId(yId);
      if (parts.length >= 4 && parts[2] === 'cat') {
        setSelectedCategoryId(parts[3] === 'all' ? 'all' : parts[3]);
      } else {
        setSelectedCategoryId('all');
      }
    }
  };

  const handleYearDropdownChange = (yearId: string) => {
    setSelectedYearId(yearId);
    // Reset category selection when changing year to ensure consistent step-by-step filtering
    setSelectedCategoryId('all');
  };

  const filteredMemories = memories.filter((m) => {
    const matchYear = selectedYearId === 'all' || m.festival_year_id === selectedYearId;
    const matchCat = selectedCategoryId === 'all' || m.category_id === selectedCategoryId;
    return matchYear && matchCat;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 pb-20 md:pb-0">
      <AdminHeader />

      <div className="flex-1 flex flex-col md:flex-row">
        <AdminSidebar />

        {/* FULL SCREEN WIDTH MAIN CONTENT AREA WITH RESPONSIVE PADDING & FIXED SIDEBAR OFFSET */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-10 w-full max-w-full md:ml-72 min-h-[calc(100vh-64px)]">
          {/* Header Banner with Filters placed directly opposite to Title */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-orange-200 gap-3">
            <div>
              <h1 className="font-editorial text-lg sm:text-2xl text-slate-900 font-bold">
                Media Memories
              </h1>
            </div>

            {/* Mobile View: Filter Icon Button Only (just like website!) */}
            <div className="block sm:hidden">
              <CustomDropdown
                variant="iconOnly"
                icon={<Filter className="w-5 h-5 text-orange-600" />}
                options={singleFilterOptions}
                value={selectedFilterValue}
                onChange={handleSingleFilterChange}
                lightMode={true}
              />
            </div>

            {/* Web View: Side-by-Side Dropdowns */}
            <div className="hidden sm:flex items-center gap-2.5">
              <CustomDropdown
                options={adminYearOptions}
                value={selectedYearId}
                onChange={handleYearDropdownChange}
                className="w-56 min-w-[190px]"
                lightMode={true}
              />

              <CustomDropdown
                options={adminCategoryOptions}
                value={selectedCategoryId}
                onChange={setSelectedCategoryId}
                className="w-56 min-w-[190px]"
                lightMode={true}
              />
            </div>
          </div>

          {/* Reorderable Memory Cards in Responsive 2-Column Grid */}
          {filteredMemories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {filteredMemories.map((m, index) => {
                const displayTitle =
                  !m.title || /^[0-9\s_a-f-]+$/i.test(m.title.trim()) || m.title.includes('http')
                    ? `Memory #${index + 1}`
                    : m.title;

                return (
                  <div
                    key={m.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, index)}
                    className="p-3 sm:p-5 rounded-2xl border-2 border-orange-200/90 hover:border-orange-500 bg-white flex flex-col justify-between cursor-move transition-all shadow-xs group"
                  >
                    {/* Top: Media Thumbnail Aspect Box */}
                    <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-slate-100 mb-2.5">
                      <SafeMediaImage
                        src={getMediaDisplayInfo(m).url}
                        alt={displayTitle}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />

                      {/* Drag Handle Top Left */}
                      <div className="absolute top-1.5 left-1.5 p-1 rounded-lg bg-black/60 text-white backdrop-blur-xs cursor-grab">
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>

                      {/* Type Badge Bottom Left */}
                      {m.media_type === 'video' ? (
                        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[8px] font-extrabold text-white uppercase tracking-wider">
                          FILM
                        </span>
                      ) : (
                        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-[8px] font-extrabold text-white uppercase tracking-wider">
                          PHOTO
                        </span>
                      )}

                      {/* Featured Highlight Badge Top Right */}
                      {m.is_featured && (
                        <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-orange-500 text-white text-[8px] font-extrabold shadow-xs flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5 fill-white text-white" />
                          <span>Featured</span>
                        </span>
                      )}
                    </div>

                    {/* Middle: Title & Metadata */}
                    <div className="min-w-0 mb-2">
                      <h4 className="text-xs sm:text-lg font-editorial font-bold text-slate-900 truncate">
                        {displayTitle}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate mt-0.5">
                        <span>{m.category?.name || 'General'}</span> &bull; <span>{m.capture_date || '2026'}</span>
                      </p>
                    </div>

                    {/* Bottom: Status & Borderless Action Buttons */}
                    <div className="flex items-center justify-between pt-2.5 sm:pt-3 border-t border-slate-100 gap-1">
                      <span
                        className={`px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider ${
                          m.is_published
                            ? 'bg-emerald-100/70 text-emerald-800'
                            : 'bg-amber-100/70 text-amber-800'
                        }`}
                      >
                        {m.is_published ? 'Published' : 'Draft'}
                      </span>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleToggleFeatured(m)}
                          title="Toggle Featured Highlight"
                          className={`p-1.5 rounded-lg text-xs transition-colors ${
                            m.is_featured
                              ? 'bg-orange-100 text-orange-700 font-bold'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setEditingMemory(m)}
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 transition-colors"
                          title="Edit Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(m)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                          title="Delete Memory"
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
              title="No Matching Memories Found"
              description="No media memories match your selected filter options. Try selecting 'All Festival Years' or 'All Categories'."
              actionText="Reset Filters"
              onAction={() => {
                setSelectedYearId('all');
                setSelectedCategoryId('all');
              }}
              badge="Admin Media Management"
              lightMode={true}
            />
          )}

          {/* Edit Memory Modal */}
          {editingMemory && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
              <div className="w-full max-w-lg p-5 sm:p-8 rounded-3xl border-2 border-orange-500 bg-white shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-auto">
                <div className="flex items-center justify-between pb-4 border-b border-orange-100">
                  <h3 className="font-editorial text-xl sm:text-2xl text-slate-900 font-bold">Edit Memory Details</h3>
                  <button onClick={() => setEditingMemory(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveEdit} className="space-y-4">
                  <div>
                    <label className="text-[11px] text-orange-700 uppercase tracking-wider block mb-1 font-bold">
                      Title
                    </label>
                    <input
                      type="text"
                      required
                      value={editingMemory.title}
                      onChange={(e) => setEditingMemory({ ...editingMemory, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Replace Main Media File (Photo or Video) */}
                  <div>
                    <label className="text-[11px] text-orange-700 uppercase tracking-wider block mb-1 font-bold">
                      Replace Main Media File ({editingMemory.media_type === 'video' ? 'Video File' : 'Photo Image File'})
                    </label>
                    <div className="space-y-1">
                      <input
                        type="file"
                        accept={editingMemory.media_type === 'video' ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp,image/avif'}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file && editingMemory) {
                            try {
                              const formData = new FormData();
                              formData.append('file', file);
                              formData.append('title', editingMemory.title);
                              formData.append('media_type', editingMemory.media_type);
                              const res = await fetch('/api/admin/memories/upload', {
                                method: 'POST',
                                body: formData,
                              });
                              if (res.ok) {
                                const data = await res.json();
                                const newUrl = data.memory?.storage_path;
                                if (newUrl) {
                                  const isImg = editingMemory.media_type === 'image';
                                  setEditingMemory({
                                    ...editingMemory,
                                    storage_path: newUrl,
                                    ...(isImg ? { thumbnail_path: newUrl } : {}),
                                  });
                                  toast.success('Media File Uploaded', `Attached new ${editingMemory.media_type} file.`);
                                }
                              }
                            } catch {
                              toast.error('Upload Error', 'Failed to upload media file.');
                            }
                          }
                        }}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 cursor-pointer font-semibold"
                      />
                      <span className="text-[10px] text-slate-500 block font-medium">
                        Select a file from your computer to replace the current {editingMemory.media_type} asset.
                      </span>
                    </div>
                  </div>

                  {/* Video Cover Thumbnail Image File Upload (Video ONLY!) */}
                  {editingMemory.media_type === 'video' && (
                    <div>
                      <label className="text-[11px] text-orange-700 uppercase tracking-wider block mb-1 font-bold">
                        Upload / Replace Video Cover Thumbnail Image
                      </label>
                      <div className="space-y-1">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file && editingMemory) {
                              try {
                                const formData = new FormData();
                                formData.append('file', file);
                                formData.append('title', `${editingMemory.title} Cover`);
                                formData.append('media_type', 'image');
                                const res = await fetch('/api/admin/memories/upload', {
                                  method: 'POST',
                                  body: formData,
                                });
                                if (res.ok) {
                                  const data = await res.json();
                                  const newUrl = data.memory?.storage_path;
                                  if (newUrl) {
                                    setEditingMemory({ ...editingMemory, thumbnail_path: newUrl });
                                    toast.success('Thumbnail Uploaded', 'Attached new cover thumbnail image file.');
                                  }
                                }
                              } catch {
                                toast.error('Upload Error', 'Could not upload cover image file.');
                              }
                            }
                          }}
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 cursor-pointer font-semibold"
                        />
                        <span className="text-[10px] text-slate-500 block font-medium">
                          Select a custom cover image file from your computer for this video.
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] text-orange-700 uppercase tracking-wider block mb-1 font-bold">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={editingMemory.description || ''}
                      onChange={(e) => setEditingMemory({ ...editingMemory, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] text-orange-700 uppercase tracking-wider block mb-1 font-bold">
                        Category
                      </label>
                      <select
                        value={editingMemory.category_id || ''}
                        onChange={(e) => setEditingMemory({ ...editingMemory, category_id: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-orange-700 uppercase tracking-wider block mb-1 font-bold">
                        Festival Year
                      </label>
                      <select
                        value={editingMemory.festival_year_id}
                        onChange={(e) => setEditingMemory({ ...editingMemory, festival_year_id: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
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
                    <label className="flex items-center space-x-2 text-xs text-slate-700 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingMemory.is_featured}
                        onChange={(e) => setEditingMemory({ ...editingMemory, is_featured: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span>Featured Memory</span>
                    </label>

                    <label className="flex items-center space-x-2 text-xs text-slate-700 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingMemory.is_published}
                        onChange={(e) => setEditingMemory({ ...editingMemory, is_published: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span>Published State</span>
                    </label>
                  </div>

                  <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setEditingMemory(null)}
                      className="px-5 py-2.5 rounded-full border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider shadow-md"
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
        onSuccess={loadData}
        defaultTarget="memories"
      />
    </div>
  );
}

