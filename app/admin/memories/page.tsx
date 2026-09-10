'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDebounce } from '@/lib/hooks/useDebounce';
import Link from 'next/link';
import {
  Edit2,
  Trash2,
  GripVertical,
  Sparkles,
  Camera,
  Film,
  Youtube,
  Search,
  Plus,
  X,
  Filter,
  CheckCircle2,
  ExternalLink,
  Layers,
  Star,
  Eye,
  EyeOff,
  Play,
  ArrowUpDown,
} from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import AdminMobileBottomBar from '@/components/AdminMobileBottomBar';
import SafeMediaImage from '@/components/SafeMediaImage';
import EmptyState from '@/components/EmptyState';
import CustomDropdown, { DropdownOption } from '@/components/CustomDropdown';
import { getMediaDisplayInfo } from '@/lib/mediaUtils';
import { toast } from '@/lib/toastStore';
import { Memory, FestivalYear, Category } from '@/types';
import { getMemories, getFestivalYears, getCategories } from '@/lib/data/repository';

type MediaFilterType = 'all' | 'photos' | 'videos' | 'hero';

function MemoriesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFilter = (searchParams.get('filter') as MediaFilterType) || 'all';

  const [activeTab, setActiveTab] = useState<MediaFilterType>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYearId, setSelectedYearId] = useState<string>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  const [memories, setMemories] = useState<Memory[]>([]);
  const [years, setYears] = useState<FestivalYear[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [pendingActionIds, setPendingActionIds] = useState<Record<string, boolean>>({});

  // Sync tab with URL query parameter if it changes
  useEffect(() => {
    const urlFilter = searchParams.get('filter') as MediaFilterType;
    if (urlFilter && ['all', 'photos', 'videos', 'hero'].includes(urlFilter)) {
      setActiveTab(urlFilter);
    }
  }, [searchParams]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [yrs, cats, mems] = await Promise.all([
        getFestivalYears(false),
        getCategories(),
        getMemories({ onlyPublished: false }),
      ]);
      setYears(yrs);
      setCategories(cats);
      setMemories(mems);
    } catch (err) {
      console.error('Failed to load memories:', err);
      toast.error('Load Error', 'Could not fetch media memories.');
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

    const currentList = [...filteredMemories];
    const [moved] = currentList.splice(sourceIndex, 1);
    currentList.splice(targetIndex, 0, moved);

    // Update in parent memory list
    const updatedAll = [...memories];
    const movedId = moved.id;
    const targetId = currentList[targetIndex + 1]?.id;

    const fromIdx = updatedAll.findIndex((m) => m.id === movedId);
    if (fromIdx !== -1) {
      const [removed] = updatedAll.splice(fromIdx, 1);
      const toIdx = targetId ? updatedAll.findIndex((m) => m.id === targetId) : updatedAll.length;
      updatedAll.splice(toIdx, 0, removed);
    }

    setMemories(updatedAll);

    // Persist to backend
    const orderedIds = updatedAll.map((m) => m.id);
    try {
      await fetch('/api/admin/memories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      toast.success(
        'Sequence Reordered',
        `Moved "${moved.title}" to position #${targetIndex + 1}.`
      );
    } catch {
      toast.error('Reorder Failed', 'Could not save new sequence order.');
    }
  };

  // One-click toggle Hero Carousel
  const handleToggleHero = async (m: Memory, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (pendingActionIds[m.id]) return; // Prevent duplicate rapid requests

    setPendingActionIds((prev) => ({ ...prev, [m.id]: true }));
    const nextState = !m.is_featured;

    // Optimistic UI update
    setMemories((prev) =>
      prev.map((item) => (item.id === m.id ? { ...item, is_featured: nextState } : item))
    );

    try {
      const res = await fetch(`/api/admin/memories/${m.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: nextState }),
      });
      if (res.ok) {
        toast.success(
          nextState ? '🌟 Added to Hero Banner' : 'Removed from Hero Banner',
          `"${m.title}" ${nextState ? 'will now rotate on the homepage hero section' : 'is now standard gallery only'}.`
        );
      } else {
        throw new Error('Failed to update');
      }
    } catch {
      // Revert on failure
      setMemories((prev) =>
        prev.map((item) => (item.id === m.id ? { ...item, is_featured: !nextState } : item))
      );
      toast.error('Update Failed', 'Could not update hero status.');
    } finally {
      setPendingActionIds((prev) => {
        const copy = { ...prev };
        delete copy[m.id];
        return copy;
      });
    }
  };

  // One-click toggle Publish/Draft
  const handleTogglePublish = async (m: Memory, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (pendingActionIds[m.id]) return; // Prevent duplicate rapid requests

    setPendingActionIds((prev) => ({ ...prev, [m.id]: true }));
    const nextState = !m.is_published;

    // Optimistic UI update
    setMemories((prev) =>
      prev.map((item) => (item.id === m.id ? { ...item, is_published: nextState } : item))
    );

    try {
      const res = await fetch(`/api/admin/memories/${m.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: nextState }),
      });
      if (res.ok) {
        toast.info(
          'Publication Updated',
          `"${m.title}" is now ${nextState ? 'Published' : 'Draft'}.`
        );
      } else {
        throw new Error('Failed to update');
      }
    } catch {
      // Revert on failure
      setMemories((prev) =>
        prev.map((item) => (item.id === m.id ? { ...item, is_published: !nextState } : item))
      );
      toast.error('Update Failed', 'Could not update publication state.');
    } finally {
      setPendingActionIds((prev) => {
        const copy = { ...prev };
        delete copy[m.id];
        return copy;
      });
    }
  };

  // Delete memory
  const handleDelete = async (m: Memory, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (pendingActionIds[m.id]) return;
    if (!confirm(`Are you sure you want to delete "${m.title}"? This cannot be undone.`)) return;

    setPendingActionIds((prev) => ({ ...prev, [m.id]: true }));

    // Optimistic UI remove
    setMemories((prev) => prev.filter((item) => item.id !== m.id));

    try {
      const res = await fetch(`/api/admin/memories/${m.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Media Deleted', `Permanently removed "${m.title}".`);
      } else {
        throw new Error('Delete failed');
      }
    } catch {
      toast.error('Delete Failed', 'Could not delete media.');
      loadData();
    } finally {
      setPendingActionIds((prev) => {
        const copy = { ...prev };
        delete copy[m.id];
        return copy;
      });
    }
  };

  // Save edit form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMemory) return;
    setSavingEdit(true);

    try {
      const res = await fetch(`/api/admin/memories/${editingMemory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingMemory.title,
          telugu_title: editingMemory.telugu_title,
          description: editingMemory.description,
          telugu_description: editingMemory.telugu_description,
          category_id: editingMemory.category_id,
          festival_year_id: editingMemory.festival_year_id,
          capture_date: editingMemory.capture_date,
          storage_path: editingMemory.storage_path,
          thumbnail_path: editingMemory.thumbnail_path,
          is_featured: editingMemory.is_featured,
          is_published: editingMemory.is_published,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('Changes Saved', `Updated details for "${editingMemory.title}".`);
        setEditingMemory(null);
        loadData();
      } else {
        throw new Error('Update failed');
      }
    } catch (err: any) {
      toast.error('Save Error', err.message || 'Could not save changes.');
    } finally {
      setSavingEdit(false);
    }
  };

  const debouncedSearchQuery = useDebounce(searchQuery, 200);

  // Counts for tabs (memoized)
  const { photoCount, videoCount, heroCount } = useMemo(() => {
    let pCount = 0;
    let vCount = 0;
    let hCount = 0;
    for (const m of memories) {
      if (m.media_type === 'image') {
        pCount++;
        if (m.is_featured) hCount++;
      } else if (m.media_type === 'video') {
        vCount++;
      }
    }
    return { photoCount: pCount, videoCount: vCount, heroCount: hCount };
  }, [memories]);

  // Filter logic (memoized)
  const filteredMemories = useMemo(() => {
    const q = debouncedSearchQuery.trim().toLowerCase();
    return memories.filter((m) => {
      // 1. Tab filter
      if (activeTab === 'photos' && m.media_type !== 'image') return false;
      if (activeTab === 'videos' && m.media_type !== 'video') return false;
      if (activeTab === 'hero' && (!m.is_featured || m.media_type !== 'image')) return false;

      // 2. Year filter
      if (selectedYearId !== 'all' && m.festival_year_id !== selectedYearId) return false;

      // 3. Category filter
      if (selectedCategoryId !== 'all' && m.category_id !== selectedCategoryId) return false;

      // 4. Search filter
      if (q) {
        const matchTitle = m.title?.toLowerCase().includes(q);
        const matchTelugu = m.telugu_title?.toLowerCase().includes(q);
        const matchCat = m.category?.name?.toLowerCase().includes(q);
        const matchDesc = m.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchTelugu && !matchCat && !matchDesc) return false;
      }

      return true;
    });
  }, [memories, activeTab, selectedYearId, selectedCategoryId, debouncedSearchQuery]);

  // Dropdown options (memoized)
  const yearOptions: DropdownOption[] = useMemo(
    () => [
      { value: 'all', label: 'All Festival Years', count: memories.length },
      ...years.map((y) => ({
        value: y.id,
        label: `${y.year} - ${y.title}`,
        count: memories.filter((m) => m.festival_year_id === y.id).length,
      })),
    ],
    [years, memories]
  );

  const categoryOptions: DropdownOption[] = useMemo(
    () => [
      { value: 'all', label: 'All Categories', count: memories.length },
      ...categories.map((c) => ({
        value: c.id,
        label: c.name,
        count: memories.filter((m) => m.category_id === c.id).length,
      })),
    ],
    [categories, memories]
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <AdminHeader />

      <div className="flex-1 flex flex-col md:flex-row">
        <AdminSidebar />

        <main className="flex-1 p-3.5 sm:p-6 lg:p-10 w-full max-w-full md:ml-72 min-h-[calc(100vh-64px)] pb-24 md:pb-8">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-orange-200 gap-2 sm:gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-editorial text-2xl sm:text-3xl text-slate-900 font-bold">
                  Media Library
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 font-extrabold">
                  {memories.length} items
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">
                Single source of truth: Manage photos (Cloudflare R2), YouTube videos, and hero
                banner slides.
              </p>
            </div>
          </div>

          {/* Segmented Filter Pills (Horizontal Touch Scroll on Mobile) */}
          <div className="flex items-center gap-1.5 sm:gap-2 mb-4 overflow-x-auto pb-1.5 scrollbar-none flex-nowrap sm:flex-wrap">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 sm:space-x-2 transition-all cursor-pointer flex-shrink-0 whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Media</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'}`}
              >
                {memories.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('photos')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 sm:space-x-2 transition-all cursor-pointer flex-shrink-0 whitespace-nowrap ${
                activeTab === 'photos'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>📷 Photos (R2)</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'photos' ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-600'}`}
              >
                {photoCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('videos')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 sm:space-x-2 transition-all cursor-pointer flex-shrink-0 whitespace-nowrap ${
                activeTab === 'videos'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Youtube className="w-3.5 h-3.5" />
              <span>🎬 YouTube Videos</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'videos' ? 'bg-red-700 text-red-100' : 'bg-slate-100 text-slate-600'}`}
              >
                {videoCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('hero')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 sm:space-x-2 transition-all cursor-pointer flex-shrink-0 whitespace-nowrap ${
                activeTab === 'hero'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>🌟 Hero Carousel</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'hero' ? 'bg-amber-600 text-amber-100' : 'bg-slate-100 text-slate-600'}`}
              >
                {heroCount}
              </span>
            </button>
          </div>

          {/* Search and Secondary Dropdown Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mb-6">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title, Telugu name, or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 font-medium shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Year Dropdown */}
            <CustomDropdown
              options={yearOptions}
              value={selectedYearId}
              onChange={setSelectedYearId}
              className="w-full sm:w-56"
              lightMode={true}
            />

            {/* Category Dropdown */}
            <CustomDropdown
              options={categoryOptions}
              value={selectedCategoryId}
              onChange={setSelectedCategoryId}
              className="w-full sm:w-56"
              lightMode={true}
            />
          </div>

          {/* Media Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs text-slate-500 font-medium">Loading media assets...</p>
            </div>
          ) : filteredMemories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredMemories.map((m, index) => {
                const isVideo = m.media_type === 'video';
                const isPhoto = m.media_type === 'image';
                const mediaInfo = getMediaDisplayInfo(m);
                const displayTitle = m.title || `Media #${index + 1}`;

                return (
                  <div
                    key={m.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, index)}
                    className="bg-white rounded-2xl border border-slate-200/90 hover:border-orange-400 transition-all shadow-2xs flex flex-col justify-between overflow-hidden group hover:shadow-md"
                  >
                    {/* Top: Media Thumbnail Box */}
                    <div className="relative w-full aspect-[16/10] bg-slate-100 overflow-hidden cursor-move">
                      <SafeMediaImage
                        src={mediaInfo.thumbnailUrl || mediaInfo.poster || mediaInfo.url}
                        poster={mediaInfo.poster}
                        alt={displayTitle}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />

                      {/* Drag Handle Top Left */}
                      <div className="absolute top-2 left-2 p-1 rounded-md bg-black/60 text-white backdrop-blur-xs cursor-grab hover:bg-black/80">
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>

                      {/* Format Badge Top Right */}
                      {isVideo ? (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-red-600 text-white text-[9px] font-extrabold flex items-center space-x-1 shadow-xs">
                          <Youtube className="w-3 h-3" />
                          <span>YOUTUBE</span>
                        </div>
                      ) : (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[9px] font-extrabold flex items-center space-x-1 shadow-xs">
                          <Camera className="w-3 h-3" />
                          <span>R2 PHOTO</span>
                        </div>
                      )}

                      {/* YouTube Play Icon Overlay if Video */}
                      {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg">
                            <Play className="w-4 h-4 fill-white ml-0.5" />
                          </div>
                        </div>
                      )}

                      {/* Hero Carousel Indicator Badge Bottom Left */}
                      {m.is_featured && isPhoto && (
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-extrabold flex items-center space-x-1 shadow-xs">
                          <Sparkles className="w-3 h-3 fill-white" />
                          <span>HERO SLIDE</span>
                        </div>
                      )}

                      {/* Capture Date Bottom Right */}
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[9px] font-medium backdrop-blur-xs">
                        {m.capture_date || '2026'}
                      </div>
                    </div>

                    {/* Middle: Title & Metadata */}
                    <div className="p-3.5 pb-2">
                      <h4
                        className="font-editorial text-sm font-bold text-slate-900 truncate"
                        title={displayTitle}
                      >
                        {displayTitle}
                      </h4>
                      {m.telugu_title && (
                        <p className="text-xs text-orange-700 font-medium truncate mt-0.5">
                          {m.telugu_title}
                        </p>
                      )}
                      <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-500 font-medium">
                        <span className="truncate">{m.category?.name || 'General'}</span>
                        <span>&bull;</span>
                        <span className="truncate">{m.festival_year?.year || '2026'}</span>
                      </div>
                    </div>

                    {/* Bottom: Streamlined Action Controls */}
                    <div className="p-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 bg-slate-50/50">
                      {/* Left: Status Toggle Badge */}
                      <button
                        onClick={(e) => handleTogglePublish(m, e)}
                        title="Click to toggle Published / Draft state"
                        className={`px-2 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer ${
                          m.is_published
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        }`}
                      >
                        {m.is_published ? 'Published' : 'Draft'}
                      </button>

                      {/* Right: Actions (Hero, Edit, Delete) */}
                      <div className="flex items-center space-x-1">
                        {/* Hero Toggle (Available for Photos) */}
                        {isPhoto ? (
                          <button
                            onClick={(e) => handleToggleHero(m, e)}
                            title={
                              m.is_featured
                                ? 'Remove from Homepage Hero Banner'
                                : 'Feature in Homepage Hero Banner'
                            }
                            className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center space-x-1 transition-all cursor-pointer ${
                              m.is_featured
                                ? 'bg-amber-100 text-amber-800 border border-amber-300 font-extrabold'
                                : 'bg-white border border-slate-200 text-slate-600 hover:border-amber-400 hover:text-amber-700'
                            }`}
                          >
                            <Sparkles
                              className={`w-3 h-3 ${m.is_featured ? 'text-amber-600 fill-amber-600' : 'text-slate-400'}`}
                            />
                            <span>{m.is_featured ? 'In Hero' : 'Hero'}</span>
                          </button>
                        ) : null}

                        {/* Edit Details */}
                        <button
                          onClick={() => setEditingMemory(m)}
                          className="p-1.5 rounded-md bg-white border border-slate-200 hover:border-amber-400 hover:text-amber-700 text-slate-600 transition-colors"
                          title="Edit Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={(e) => handleDelete(m, e)}
                          className="p-1.5 rounded-md bg-white border border-slate-200 hover:border-rose-400 hover:text-rose-700 text-slate-600 transition-colors"
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
              title="No Media Found"
              description="No media assets match your active filters or search term."
              actionText="Reset All Filters"
              onAction={() => {
                setActiveTab('all');
                setSearchQuery('');
                setSelectedYearId('all');
                setSelectedCategoryId('all');
              }}
              badge="Media Library"
              lightMode={true}
            />
          )}

          {/* Edit Memory Modal */}
          {editingMemory && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
              <div className="w-full max-w-xl p-6 rounded-3xl border border-orange-300 bg-white shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto my-auto">
                <div className="flex items-center justify-between pb-3 border-b border-orange-100">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-editorial text-xl text-slate-900 font-bold">
                      Edit Media Asset
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded font-extrabold uppercase tracking-wider bg-orange-100 text-orange-800">
                      {editingMemory.media_type === 'video'
                        ? 'YouTube Video'
                        : 'Cloudflare R2 Photo'}
                    </span>
                  </div>
                  <button
                    onClick={() => setEditingMemory(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveEdit} className="space-y-4">
                  {/* Title Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Title (English) *
                      </label>
                      <input
                        type="text"
                        required
                        value={editingMemory.title}
                        onChange={(e) =>
                          setEditingMemory({ ...editingMemory, title: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Title (Telugu)
                      </label>
                      <input
                        type="text"
                        value={editingMemory.telugu_title || ''}
                        onChange={(e) =>
                          setEditingMemory({ ...editingMemory, telugu_title: e.target.value })
                        }
                        placeholder="శ్రీ వినాయక చవితి..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {/* Year & Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Festival Year *
                      </label>
                      <select
                        value={editingMemory.festival_year_id}
                        onChange={(e) =>
                          setEditingMemory({ ...editingMemory, festival_year_id: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                      >
                        {years.map((y) => (
                          <option key={y.id} value={y.id}>
                            {y.year} - {y.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Category *
                      </label>
                      <select
                        value={editingMemory.category_id || ''}
                        onChange={(e) =>
                          setEditingMemory({ ...editingMemory, category_id: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Capture Date */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Capture Date
                    </label>
                    <input
                      type="date"
                      value={editingMemory.capture_date || ''}
                      onChange={(e) =>
                        setEditingMemory({ ...editingMemory, capture_date: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Descriptions */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Description (English)
                    </label>
                    <textarea
                      rows={2}
                      value={editingMemory.description || ''}
                      onChange={(e) =>
                        setEditingMemory({ ...editingMemory, description: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Switch Controls: Hero Carousel & Published */}
                  <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    {editingMemory.media_type === 'image' && (
                      <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingMemory.is_featured}
                          onChange={(e) =>
                            setEditingMemory({ ...editingMemory, is_featured: e.target.checked })
                          }
                          className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-orange-300"
                        />
                        <span>🌟 Feature in Homepage Hero Carousel</span>
                      </label>
                    )}

                    <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingMemory.is_published}
                        onChange={(e) =>
                          setEditingMemory({ ...editingMemory, is_published: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-orange-300"
                      />
                      <span>Visible / Published</span>
                    </label>
                  </div>

                  {/* Modal Action Buttons */}
                  <div className="pt-3 flex items-center justify-end space-x-2.5 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setEditingMemory(null)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingEdit}
                      className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-wider shadow-md disabled:opacity-50"
                    >
                      {savingEdit ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      <AdminMobileBottomBar />
    </div>
  );
}

export default function AdminMemoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <MemoriesContent />
    </Suspense>
  );
}
