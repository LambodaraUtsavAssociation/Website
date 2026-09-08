'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Upload,
  Sparkles,
  Camera,
  Youtube,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Play,
  Film,
  Layers,
  HelpCircle,
  Calendar,
  Tag,
  Info,
  ArrowRight,
} from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import AdminMobileBottomBar from '@/components/AdminMobileBottomBar';
import CustomDropdown, { DropdownOption } from '@/components/CustomDropdown';
import { toast } from '@/lib/toastStore';
import { FestivalYear, Category } from '@/types';
import { getFestivalYears, getCategories } from '@/lib/data/repository';
import { parseYouTubeUrl } from '@/lib/youtube';
import { uploadImageToR2 } from '@/lib/clientStorage';

interface PhotoBatchItem {
  id: string;
  file: File;
  previewUrl: string;
  title: string;
  teluguTitle: string;
  sizeFormatted: string;
  status: 'idle' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

interface YouTubeBatchItem {
  id: string;
  youtubeUrl: string;
  videoId: string | null;
  thumbnailUrl: string | null;
  title: string;
  teluguTitle: string;
  status: 'idle' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

const MAX_BATCH_SIZE = 5;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldFeatureInHero = searchParams.get('feature') === 'hero';

  // Mode: Photos (R2) vs YouTube Videos
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');

  // Photo batch
  const [photoBatch, setPhotoBatch] = useState<PhotoBatchItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // YouTube batch
  const [youtubeBatch, setYoutubeBatch] = useState<YouTubeBatchItem[]>([]);

  // Metadata
  const [years, setYears] = useState<FestivalYear[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [captureDate, setCaptureDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [isFeaturedInHero, setIsFeaturedInHero] = useState(shouldFeatureInHero);

  // Status
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadMetadata();
  }, []);

  async function loadMetadata() {
    try {
      let yrs: FestivalYear[] = [];
      try {
        const res = await fetch('/api/admin/years', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.years && Array.isArray(data.years) && data.years.length > 0) {
            yrs = data.years;
          }
        }
      } catch {
        // Fallback to repository
      }

      if (yrs.length === 0) {
        yrs = await getFestivalYears(false);
      }

      const cats = await getCategories();
      setYears(yrs);
      if (yrs.length > 0) setSelectedYearId(yrs[0].id);

      setCategories(cats);
      if (cats.length > 0) setSelectedCategoryId(cats[0].id);
    } catch (err) {
      console.error('Failed to load upload metadata:', err);
    }
  }

  // ── Photo Selection Handlers ──────────────────────────────────────────────
  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMsg(null);

    const availableSlots = MAX_BATCH_SIZE - photoBatch.length;
    if (availableSlots <= 0) {
      toast.warning('Batch Limit Reached', `Maximum ${MAX_BATCH_SIZE} photos per batch.`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, availableSlots);
    if (files.length > availableSlots) {
      toast.info('Batch Capped', `Added ${availableSlots} photos. Maximum is ${MAX_BATCH_SIZE} at a time.`);
    }

    const newItems: PhotoBatchItem[] = filesToProcess.map((file) => {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

      return {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        title: cleanName,
        teluguTitle: '',
        sizeFormatted: formatFileSize(file.size),
        status: 'idle',
      };
    });

    setPhotoBatch((prev) => [...prev, ...newItems]);
  };

  const removePhotoItem = (id: string) => {
    setPhotoBatch((prev) => prev.filter((item) => item.id !== id));
  };

  const updatePhotoTitle = (id: string, title: string) => {
    setPhotoBatch((prev) => prev.map((item) => (item.id === id ? { ...item, title } : item)));
  };

  const updatePhotoTeluguTitle = (id: string, teluguTitle: string) => {
    setPhotoBatch((prev) => prev.map((item) => (item.id === id ? { ...item, teluguTitle } : item)));
  };

  // ── YouTube Handlers ───────────────────────────────────────────────────────
  const addYouTubeItem = () => {
    if (youtubeBatch.length >= MAX_BATCH_SIZE) {
      toast.warning('Batch Limit Reached', `Maximum ${MAX_BATCH_SIZE} YouTube videos per batch.`);
      return;
    }
    const newItem: YouTubeBatchItem = {
      id: `yt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      youtubeUrl: '',
      videoId: null,
      thumbnailUrl: null,
      title: '',
      teluguTitle: '',
      status: 'idle',
    };
    setYoutubeBatch((prev) => [...prev, newItem]);
  };

  const updateYouTubeUrl = (id: string, youtubeUrl: string) => {
    const parsed = parseYouTubeUrl(youtubeUrl);
    setYoutubeBatch((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              youtubeUrl,
              videoId: parsed?.videoId || null,
              thumbnailUrl: parsed?.thumbnailUrl || null,
              title: item.title || (parsed?.videoId ? `Festival Celebration Video` : ''),
            }
          : item
      )
    );
  };

  const updateYouTubeTitle = (id: string, title: string) => {
    setYoutubeBatch((prev) => prev.map((item) => (item.id === id ? { ...item, title } : item)));
  };

  const updateYouTubeTeluguTitle = (id: string, teluguTitle: string) => {
    setYoutubeBatch((prev) => prev.map((item) => (item.id === id ? { ...item, teluguTitle } : item)));
  };

  const removeYouTubeItem = (id: string) => {
    setYoutubeBatch((prev) => prev.filter((item) => item.id !== id));
  };

  // ── Execute Photo Upload to Cloudflare R2 ──────────────────────────────────
  const executePhotoUpload = async () => {
    if (photoBatch.length === 0) {
      setErrorMsg('Please select at least 1 photo to upload.');
      return;
    }

    const emptyIdx = photoBatch.findIndex((i) => !i.title.trim());
    if (emptyIdx !== -1) {
      setErrorMsg(`Please enter a title for photo #${emptyIdx + 1}.`);
      return;
    }

    setUploading(true);
    setErrorMsg(null);
    let successCount = 0;
    let failCount = 0;

    for (const item of photoBatch) {
      if (item.status === 'success') {
        successCount++;
        continue;
      }

      setPhotoBatch((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading' } : i)));

      try {
        // Step 1: Upload directly to Cloudflare R2 bucket
        const { publicUrl, thumbnailUrl } = await uploadImageToR2(item.file, 'photos');

        // Step 2: Record in single source of truth (memories table)
        const fd = new FormData();
        fd.append('storage_path', publicUrl);
        fd.append('thumbnail_path', thumbnailUrl);
        fd.append('title', item.title.trim());
        if (item.teluguTitle.trim()) fd.append('telugu_title', item.teluguTitle.trim());
        fd.append('description', description.trim());
        fd.append('festival_year_id', selectedYearId);
        fd.append('category_id', selectedCategoryId);
        fd.append('capture_date', captureDate);
        fd.append('media_type', 'image');
        fd.append('is_featured', isFeaturedInHero ? 'true' : 'false');
        fd.append('is_published', 'true');

        const res = await fetch('/api/admin/memories/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Failed to save photo record');

        successCount++;
        setPhotoBatch((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'success' } : i)));
      } catch (err: any) {
        failCount++;
        setPhotoBatch((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: 'error', errorMessage: err.message || 'Upload error' } : i))
        );
      }
    }

    setUploading(false);

    if (failCount === 0) {
      toast.success(
        'Upload Complete!',
        `Successfully uploaded ${successCount} photo(s) to Cloudflare R2${isFeaturedInHero ? ' and featured in Hero Carousel' : ''}.`
      );
      setTimeout(() => {
        router.push(isFeaturedInHero ? '/admin/hero' : '/admin/memories');
      }, 1200);
    } else {
      toast.error('Partial Upload Failure', `${successCount} photos uploaded, ${failCount} failed.`);
    }
  };

  // ── Execute YouTube Video Save ─────────────────────────────────────────────
  const executeYouTubeUpload = async () => {
    if (youtubeBatch.length === 0) {
      setErrorMsg('Please add at least 1 YouTube video link.');
      return;
    }

    const invalidIdx = youtubeBatch.findIndex((i) => !i.videoId);
    if (invalidIdx !== -1) {
      setErrorMsg(`Video #${invalidIdx + 1} does not have a valid YouTube link.`);
      return;
    }

    const emptyIdx = youtubeBatch.findIndex((i) => !i.title.trim());
    if (emptyIdx !== -1) {
      setErrorMsg(`Please enter a title for video #${emptyIdx + 1}.`);
      return;
    }

    setUploading(true);
    setErrorMsg(null);
    let successCount = 0;
    let failCount = 0;

    for (const item of youtubeBatch) {
      if (item.status === 'success') {
        successCount++;
        continue;
      }

      setYoutubeBatch((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading' } : i)));

      try {
        const fd = new FormData();
        fd.append('youtube_url', item.youtubeUrl);
        fd.append('title', item.title.trim());
        if (item.teluguTitle.trim()) fd.append('telugu_title', item.teluguTitle.trim());
        fd.append('description', description.trim());
        fd.append('festival_year_id', selectedYearId);
        fd.append('category_id', selectedCategoryId);
        fd.append('capture_date', captureDate);
        fd.append('media_type', 'video');
        fd.append('is_featured', 'false');
        fd.append('is_published', 'true');

        const res = await fetch('/api/admin/memories/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Failed to save YouTube record');

        successCount++;
        setYoutubeBatch((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'success' } : i)));
      } catch (err: any) {
        failCount++;
        setYoutubeBatch((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: 'error', errorMessage: err.message || 'Save error' } : i))
        );
      }
    }

    setUploading(false);

    if (failCount === 0) {
      toast.success('Videos Saved!', `Successfully linked ${successCount} YouTube video(s) to Media Library.`);
      setTimeout(() => {
        router.push('/admin/memories?filter=videos');
      }, 1200);
    } else {
      toast.error('Partial Save Failure', `${successCount} videos saved, ${failCount} failed.`);
    }
  };

  // Dropdown options
  const yearOptions: DropdownOption[] = years.map((y) => ({ value: y.id, label: `${y.year} - ${y.title}` }));
  const categoryOptions: DropdownOption[] = categories.map((c) => ({ value: c.id, label: c.name }));

  const activeBatchCount = activeTab === 'photos' ? photoBatch.length : youtubeBatch.length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <AdminHeader />

      <div className="flex-1 flex flex-col md:flex-row">
        <AdminSidebar />

        {/* FULL PAGE EXPANSIVE WORKSPACE */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-10 w-full max-w-full md:ml-72 min-h-[calc(100vh-64px)] flex flex-col pb-28 md:pb-8">
          {/* Top Page Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-orange-200 gap-2 sm:gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="font-editorial text-2xl sm:text-4xl text-slate-900 font-bold tracking-tight">
                  Media Upload Studio
                </h1>
                <span className="text-xs px-3 py-1 rounded-full bg-orange-100 text-orange-800 font-extrabold uppercase tracking-wider">
                  Single Source of Truth
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
                The centralized portal for all festival media. Photos upload to Cloudflare R2 (with optional Hero feature); videos stream via YouTube.
              </p>
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-500 font-semibold bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
              <Layers className="w-4 h-4 text-orange-500" />
              <span>Max {MAX_BATCH_SIZE} Files / Batch</span>
            </div>
          </div>

          {/* TWO-COLUMN FULL PAGE LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
            {/* LEFT COLUMN (lg:col-span-4): Metadata & Settings */}
            <div className="lg:col-span-4 space-y-5">
              {/* Type Switcher Pills */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-2 shadow-xs grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('photos');
                    setErrorMsg(null);
                  }}
                  className={`py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    activeTab === 'photos'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>📷 Photo Memory</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('videos');
                    setErrorMsg(null);
                    if (youtubeBatch.length === 0) addYouTubeItem();
                  }}
                  className={`py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    activeTab === 'videos'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Youtube className="w-4 h-4" />
                  <span>🎬 YouTube Video</span>
                </button>
              </div>

              {/* Photos Only: Hero Banner Feature Switch Card */}
              {activeTab === 'photos' && (
                <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-amber-500/5 rounded-3xl border-2 border-amber-400/80 p-5 shadow-xs space-y-2">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="heroSwitch"
                      checked={isFeaturedInHero}
                      onChange={(e) => setIsFeaturedInHero(e.target.checked)}
                      className="w-5 h-5 rounded text-orange-600 focus:ring-orange-500 border-amber-300 mt-0.5 cursor-pointer flex-shrink-0"
                    />
                    <div>
                      <label htmlFor="heroSwitch" className="text-sm font-bold text-slate-900 cursor-pointer flex items-center space-x-1.5">
                        <Sparkles className="w-4 h-4 text-amber-600 fill-amber-600" />
                        <span>Feature in Hero Carousel &amp; Gallery</span>
                      </label>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        When switched on, this photo is featured as a full-screen rotating slide on the <strong>homepage hero banner</strong> AND also appears in the celebration chapters gallery timeline.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Shared Metadata Card */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
                <h3 className="font-editorial text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Celebration Attributes
                </h3>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Festival Year *
                  </label>
                  <CustomDropdown
                    options={yearOptions}
                    value={selectedYearId}
                    onChange={setSelectedYearId}
                    lightMode={true}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Celebration Chapter Category *
                  </label>
                  <CustomDropdown
                    options={categoryOptions}
                    value={selectedCategoryId}
                    onChange={setSelectedCategoryId}
                    lightMode={true}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Capture Date
                  </label>
                  <input
                    type="date"
                    value={captureDate}
                    onChange={(e) => setCaptureDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Batch Description / Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide context or memories from this occasion..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Infrastructure Guide Card */}
              <div className="bg-slate-100/70 rounded-3xl p-5 text-xs text-slate-600 space-y-2 border border-slate-200">
                <h4 className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <Info className="w-4 h-4 text-orange-600" />
                  <span>Cloudflare R2 &amp; YouTube Architecture</span>
                </h4>
                <p className="leading-relaxed text-[11px]">
                  • <strong>Photos</strong> upload directly to Cloudflare R2 bucket <code className="bg-white px-1 py-0.5 rounded text-slate-800">lambodara-media</code>. Full HD, zero compression artifacts, zero egress costs.
                </p>
                <p className="leading-relaxed text-[11px]">
                  • <strong>Videos</strong> stream via YouTube. We store only the clean video ID, giving high-performance streaming with zero video hosting charges.
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN (lg:col-span-8): Media Canvas */}
            <div className="lg:col-span-8 space-y-5">
              {/* TAB 1: Photos Workspace */}
              {activeTab === 'photos' && (
                <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-8 shadow-xs space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-editorial text-lg sm:text-xl font-bold text-slate-900">
                        Photo Memory Dropzone
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Upload up to {MAX_BATCH_SIZE} photos simultaneously. JPG, PNG, WebP, AVIF accepted.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                      {photoBatch.length} / {MAX_BATCH_SIZE} Selected
                    </span>
                  </div>

                  {/* Large Expansive Dropzone */}
                  {photoBatch.length < MAX_BATCH_SIZE && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-3 border-dashed border-blue-200 hover:border-blue-500 rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all bg-blue-50/20 hover:bg-blue-50/50 group"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        className="hidden"
                        onChange={(e) => {
                          handleFilesSelected(e.target.files);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                      />
                      <div className="w-16 h-16 rounded-3xl bg-blue-100 text-blue-600 mx-auto flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-xs">
                        <Upload className="w-8 h-8" />
                      </div>
                      <h4 className="text-base sm:text-lg font-bold text-slate-900">
                        Drag and drop photos here, or browse files
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                        Photos are securely transferred directly to Cloudflare R2 storage. No size limits, crystal-clear quality.
                      </p>
                    </div>
                  )}

                  {/* Photo Batch Item Cards */}
                  {photoBatch.length > 0 && (
                    <div className="space-y-3.5">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                        Selected Photos ({photoBatch.length})
                      </h4>
                      {photoBatch.map((item, idx) => (
                        <div
                          key={item.id}
                          className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-blue-300 transition-all flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-2xs"
                        >
                          {/* Thumbnail */}
                          <div className="relative w-24 h-20 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0 border border-slate-200">
                            <img src={item.previewUrl} alt={item.title} className="w-full h-full object-cover" />
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-white">
                              {item.sizeFormatted}
                            </span>
                            <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-blue-600 text-[9px] font-extrabold text-white">
                              #{idx + 1}
                            </span>
                          </div>

                          {/* Title Inputs */}
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                                Title (English) *
                              </label>
                              <input
                                type="text"
                                required
                                value={item.title}
                                onChange={(e) => updatePhotoTitle(item.id, e.target.value)}
                                placeholder="Lord Vinayaka Pandal Aarti..."
                                disabled={uploading}
                                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                                Title (Telugu Optional)
                              </label>
                              <input
                                type="text"
                                value={item.teluguTitle}
                                onChange={(e) => updatePhotoTeluguTitle(item.id, e.target.value)}
                                placeholder="శ్రీ వినాయక పూజ..."
                                disabled={uploading}
                                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>

                          {/* Status / Delete */}
                          <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
                            {item.status === 'uploading' && (
                              <div className="flex items-center space-x-1.5 text-blue-600 text-xs font-bold">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span>Uploading...</span>
                              </div>
                            )}
                            {item.status === 'success' && (
                              <div className="flex items-center space-x-1 text-emerald-600 text-xs font-bold">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Saved</span>
                              </div>
                            )}
                            {item.status === 'error' && (
                              <div className="flex items-center space-x-1 text-rose-600 text-xs font-bold" title={item.errorMessage}>
                                <AlertCircle className="w-4 h-4" />
                                <span>Failed</span>
                              </div>
                            )}
                            {!uploading && item.status !== 'success' && (
                              <button
                                type="button"
                                onClick={() => removePhotoItem(item.id)}
                                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Remove photo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: YouTube Videos Workspace */}
              {activeTab === 'videos' && (
                <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-8 shadow-xs space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-editorial text-lg sm:text-xl font-bold text-slate-900">
                        YouTube Video Memory Hub
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Add video links for instant zero-lag streaming. Free CDN hosting directly from YouTube.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addYouTubeItem}
                      disabled={youtubeBatch.length >= MAX_BATCH_SIZE || uploading}
                      className="inline-flex items-center space-x-1 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Another Video</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {youtubeBatch.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-red-300 transition-all space-y-3.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                            <Play className="w-3.5 h-3.5 text-red-600 fill-red-600" />
                            <span>Video #{idx + 1}</span>
                          </span>
                          {youtubeBatch.length > 1 && !uploading && (
                            <button
                              type="button"
                              onClick={() => removeYouTubeItem(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                              title="Remove"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* YouTube URL Input */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                            YouTube Video Link or Shorts URL *
                          </label>
                          <input
                            type="text"
                            required
                            value={item.youtubeUrl}
                            onChange={(e) => updateYouTubeUrl(item.id, e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                            disabled={uploading}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-red-500"
                          />
                        </div>

                        {/* Live Facade Thumbnail Preview */}
                        {item.videoId ? (
                          <div className="flex items-center space-x-3.5 p-3 rounded-xl bg-red-50/70 border border-red-200">
                            <div className="relative w-28 h-18 rounded-lg overflow-hidden bg-black flex-shrink-0">
                              <img
                                src={item.thumbnailUrl || ''}
                                alt="YouTube Thumbnail"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
                                  <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                                </div>
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 block">
                                Verified Video ID: {item.videoId}
                              </span>
                              <span className="text-xs text-slate-700 font-medium truncate block mt-0.5">
                                Real-time high resolution cover thumbnail loaded from YouTube CDN.
                              </span>
                            </div>
                          </div>
                        ) : item.youtubeUrl ? (
                          <p className="text-xs text-amber-700 font-medium">
                            ⚠️ Enter a valid YouTube video URL (watch link, youtu.be, or shorts).
                          </p>
                        ) : null}

                        {/* Video Title Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                              Title (English) *
                            </label>
                            <input
                              type="text"
                              required
                              value={item.title}
                              onChange={(e) => updateYouTubeTitle(item.id, e.target.value)}
                              placeholder="Evening Pandal Aarti & Devotion..."
                              disabled={uploading}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-red-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                              Title (Telugu Optional)
                            </label>
                            <input
                              type="text"
                              value={item.teluguTitle}
                              onChange={(e) => updateYouTubeTeluguTitle(item.id, e.target.value)}
                              placeholder="సాయంత్రం హారతి..."
                              disabled={uploading}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-red-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Callout */}
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Submit Bar */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">
                  {activeTab === 'photos' ? (
                    <span>
                      Ready to upload {photoBatch.length} photo(s) to Cloudflare R2
                      {isFeaturedInHero ? ' (featured in Hero Carousel & Gallery)' : ' (Gallery)'}
                    </span>
                  ) : (
                    <span>Ready to save {youtubeBatch.length} YouTube video link(s) to Media Library</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={activeTab === 'photos' ? executePhotoUpload : executeYouTubeUpload}
                  disabled={uploading || activeBatchCount === 0}
                  className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all active:scale-95 flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-50 ${
                    activeTab === 'photos'
                      ? 'bg-blue-600 hover:bg-blue-500'
                      : 'bg-red-600 hover:bg-red-500'
                  }`}
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing {activeBatchCount} item(s)...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-white" />
                      <span>
                        {activeTab === 'photos'
                          ? `Upload ${activeBatchCount} Photo(s) to Cloudflare R2`
                          : `Save ${activeBatchCount} Video(s) to Library`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <AdminMobileBottomBar />
    </div>
  );
}

export default function AdminUploadPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <UploadContent />
    </Suspense>
  );
}
