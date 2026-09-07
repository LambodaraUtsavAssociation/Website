'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Sparkles,
  Images,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Tag,
  Film,
  FileCheck,
  Plus,
  Trash2,
  Camera,
  ArrowLeft,
} from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import AdminMobileBottomBar from '@/components/AdminMobileBottomBar';
import SafeMediaImage from '@/components/SafeMediaImage';
import CustomDropdown, { DropdownOption } from '@/components/CustomDropdown';
import { toast } from '@/lib/toastStore';
import { FestivalYear, Category } from '@/types';
import { getFestivalYears, getCategories } from '@/lib/data/repository';

interface UploadBatchItem {
  id: string;
  file: File;
  previewUrl: string;
  mediaType: 'image' | 'video';
  title: string;
  status: 'idle' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
  generatedId: string;
  thumbnailFile?: File;
  thumbnailPreviewUrl?: string;
}

const MAX_BATCH_SIZE = 5;

export default function AdminUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [targetSection, setTargetSection] = useState<'memories' | 'hero'>('memories');
  const [batchItems, setBatchItems] = useState<UploadBatchItem[]>([]);

  // Memory Specific Shared Fields
  const [years, setYears] = useState<FestivalYear[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [captureDate, setCaptureDate] = useState('2026-09-08');
  const [isFeatured, setIsFeatured] = useState(false);

  // Upload Progress State
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadMetadata();
  }, []);

  async function loadMetadata() {
    try {
      const yrs = await getFestivalYears(false);
      setYears(yrs);
      if (yrs.length > 0) setSelectedYearId(yrs[0].id);

      const cats = await getCategories();
      setCategories(cats);
      if (cats.length > 0) setSelectedCategoryId(cats[0].id);
    } catch (err) {
      console.error('Failed to load upload metadata:', err);
    }
  }

  const selectedYearObj = years.find((y) => y.id === selectedYearId);
  const yearNumber = selectedYearObj ? selectedYearObj.year : 2026;

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMsg(null);

    const availableSlots = MAX_BATCH_SIZE - batchItems.length;
    if (availableSlots <= 0) {
      toast.warning('Batch Limit Reached', `Maximum allowed uploads per batch is ${MAX_BATCH_SIZE} files.`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, availableSlots);
    if (files.length > availableSlots) {
      toast.info('Batch Capped', `Only the first ${availableSlots} files were added. Max limit is 5 files.`);
    }

    const newQueueItems: UploadBatchItem[] = filesToProcess.map((file, idx) => {
      const isVideo = file.type.startsWith('video/');
      const mediaType: 'image' | 'video' = isVideo ? 'video' : 'image';
      const previewUrl = URL.createObjectURL(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      const currentIndex = batchItems.length + idx + 1;
      const seqStr = String(currentIndex).padStart(3, '0');
      const genId = targetSection === 'memories' ? `MEM-${yearNumber}-${seqStr}` : `HERO-${yearNumber}-${seqStr}`;

      return {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        previewUrl,
        mediaType,
        title: cleanName,
        status: 'idle',
        generatedId: genId,
      };
    });

    setBatchItems((prev) => [...prev, ...newQueueItems]);
  };

  const removeBatchItem = (id: string) => {
    setBatchItems((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      return filtered.map((item, idx) => {
        const seqStr = String(idx + 1).padStart(3, '0');
        const genId = targetSection === 'memories' ? `MEM-${yearNumber}-${seqStr}` : `HERO-${yearNumber}-${seqStr}`;
        return { ...item, generatedId: genId };
      });
    });
  };

  const handleReset = () => {
    setBatchItems([]);
    setDescription('');
    setErrorMsg(null);
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const executeUpload = async () => {
    if (batchItems.length === 0) {
      setErrorMsg('Please select at least 1 image or video file (up to 5 max).');
      return;
    }

    if (targetSection === 'memories') {
      const emptyIdx = batchItems.findIndex((i) => !i.title.trim());
      if (emptyIdx !== -1) {
        setErrorMsg(`Please enter a title for file #${emptyIdx + 1} (${batchItems[emptyIdx].file.name}).`);
        return;
      }
    }

    setUploading(true);
    setErrorMsg(null);

    let successCount = 0;
    let failCount = 0;

    for (let index = 0; index < batchItems.length; index++) {
      const item = batchItems[index];

      if (item.status === 'success') {
        successCount++;
        continue;
      }

      setBatchItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading' } : i))
      );

      try {
        if (targetSection === 'hero') {
          // Direct signed client storage upload to bypass serverless 4.5MB payload limits
          const { uploadFileWithSignedUrl } = await import('@/lib/clientStorage');
          const directHeroUrl = await uploadFileWithSignedUrl(item.file, 'hero-section', 'hero-media');

          const formData = new FormData();
          formData.append('url', directHeroUrl);
          formData.append('caption', item.title.trim() || item.file.name);

          const res = await fetch('/api/admin/hero/upload', {
            method: 'POST',
            body: formData,
          });

          const data = await res.json();
          if (!res.ok || data.error) {
            throw new Error(data.error || 'Hero upload failed');
          }
        } else {
          // Direct signed client storage upload for memories (photos & videos of ANY size)
          const { uploadFileWithSignedUrl } = await import('@/lib/clientStorage');
          const directStorageUrl = await uploadFileWithSignedUrl(item.file, 'festival-media', `${item.mediaType}s`);
          let directThumbUrl: string | null = null;
          if (item.thumbnailFile) {
            directThumbUrl = await uploadFileWithSignedUrl(item.thumbnailFile, 'festival-media', 'thumbnails');
          }

          const formData = new FormData();
          formData.append('storage_path', directStorageUrl);
          if (directThumbUrl) {
            formData.append('thumbnail_path', directThumbUrl);
          }

          formData.append('title', item.title.trim());
          formData.append('description', description.trim());
          formData.append('festival_year_id', selectedYearId);
          formData.append('category_id', selectedCategoryId);
          formData.append('capture_date', captureDate);
          formData.append('media_type', item.mediaType);
          formData.append('is_featured', isFeatured ? 'true' : 'false');
          formData.append('is_published', 'true');

          const res = await fetch('/api/admin/memories/upload', {
            method: 'POST',
            body: formData,
          });

          const data = await res.json();
          if (!res.ok || data.error) {
            throw new Error(data.error || 'Memory upload failed');
          }
        }

        successCount++;
        setBatchItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: 'success' } : i))
        );
      } catch (err: any) {
        failCount++;
        setBatchItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'error', errorMessage: err.message || 'Upload error' } : i
          )
        );
      }
    }

    setUploading(false);

    if (failCount === 0) {
      toast.success(
        'Upload Complete!',
        `Successfully uploaded ${successCount} ${targetSection === 'memories' ? 'media memories' : 'hero slides'}.`
      );
      setTimeout(() => {
        router.push(targetSection === 'memories' ? '/admin/memories' : '/admin/hero');
      }, 1000);
    } else {
      toast.error('Partial Upload Failure', `${successCount} items uploaded, ${failCount} failed.`);
    }
  };

  const yearOptions: DropdownOption[] = years.map((y) => ({
    value: y.id,
    label: `${y.year} - ${y.title}`,
  }));

  const categoryOptions: DropdownOption[] = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 pb-24 md:pb-0">
      <AdminHeader />

      <div className="flex-1 flex flex-col md:flex-row">
        <AdminSidebar />

        <main className="flex-1 p-3.5 sm:p-6 lg:p-10 w-full max-w-full md:ml-72 min-h-[calc(100vh-64px)]">
          {/* Top Header Row */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-orange-200 gap-3">
            <div className="flex items-center space-x-2 min-w-0">
              <button
                onClick={() => router.back()}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex-shrink-0"
                title="Go Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="font-editorial text-lg sm:text-2xl text-slate-900 font-bold truncate">
                Upload Media Memories
              </h1>
            </div>
            <span className="text-[10px] sm:text-xs font-extrabold text-orange-800 bg-orange-100 px-2.5 py-1 rounded-full uppercase tracking-wider flex-shrink-0">
              Batch Max 5 Files
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-8 shadow-sm space-y-6">
            {/* Target Section Selection */}
            <div>
              <label className="text-xs font-extrabold text-orange-800 uppercase tracking-wider block mb-2">
                1. Select Target Gallery Section
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTargetSection('memories')}
                  className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    targetSection === 'memories'
                      ? 'bg-orange-500 text-white border-orange-600 shadow-md scale-[1.01]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-orange-300'
                  }`}
                >
                  <Images className="w-4 h-4" />
                  <span>Media Gallery</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetSection('hero')}
                  className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    targetSection === 'hero'
                      ? 'bg-orange-500 text-white border-orange-600 shadow-md scale-[1.01]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-orange-300'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Hero Banner</span>
                </button>
              </div>
            </div>

            {/* Target Section Settings */}
            {targetSection === 'memories' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-orange-50/60 border border-orange-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-orange-800 uppercase tracking-wider block mb-1.5">
                      Festival Year
                    </label>
                    <CustomDropdown
                      options={yearOptions}
                      value={selectedYearId}
                      onChange={setSelectedYearId}
                      lightMode={true}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-orange-800 uppercase tracking-wider block mb-1.5">
                      Celebration Category
                    </label>
                    <CustomDropdown
                      options={categoryOptions}
                      value={selectedCategoryId}
                      onChange={setSelectedCategoryId}
                      lightMode={true}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-orange-800 uppercase tracking-wider block mb-1.5">
                      Capture Date
                    </label>
                    <input
                      type="date"
                      value={captureDate}
                      onChange={(e) => setCaptureDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-orange-200 text-xs text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="flex items-center space-x-3 pt-6">
                    <input
                      type="checkbox"
                      id="isFeaturedToggle"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-orange-300"
                    />
                    <label htmlFor="isFeaturedToggle" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                      Mark as Featured Highlight
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Multi-File Upload Picker Area */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-extrabold text-orange-800 uppercase tracking-wider">
                  2. Choose Media Files ({batchItems.length}/{MAX_BATCH_SIZE})
                </label>
                {batchItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold uppercase tracking-wider"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
                onChange={(e) => handleFilesSelected(e.target.files)}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-6 sm:p-8 rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50/40 hover:bg-orange-50/80 hover:border-orange-500 transition-all text-center cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 mx-auto flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Tap to select up to 5 photos or videos
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  JPG, PNG, WEBP, MP4, WEBM or MOV files allowed.
                </p>
              </div>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Selected Queue Items List */}
            {batchItems.length > 0 && (
              <div className="space-y-3">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                  Selected Files Queue ({batchItems.length})
                </label>

                {batchItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                  >
                    <div className="flex items-center space-x-3">
                      {/* Media Preview */}
                      <div className="relative w-16 h-14 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0">
                        {item.mediaType === 'video' ? (
                          <video src={item.previewUrl} className="w-full h-full object-cover" />
                        ) : (
                          <SafeMediaImage
                            src={item.previewUrl}
                            alt={item.title}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        )}
                        <span className="absolute top-1 left-1 px-1 py-0.2 bg-black/75 text-[8px] font-extrabold text-white uppercase rounded">
                          {item.mediaType === 'video' ? 'FILM' : 'PHOTO'}
                        </span>
                      </div>

                      {/* Title & Metadata Inputs */}
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-orange-600 uppercase">
                            #{idx + 1} &bull; {item.generatedId}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeBatchItem(item.id)}
                            className="text-rose-600 hover:text-rose-700 p-1"
                            title="Remove File"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBatchItems((prev) =>
                              prev.map((i) => (i.id === item.id ? { ...i, title: val } : i))
                            );
                          }}
                          placeholder="Enter Media Title..."
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    {/* Video Poster Thumbnail Upload (If Video File) */}
                    {item.mediaType === 'video' && targetSection === 'memories' && (
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                        <span className="text-[11px] font-bold text-slate-700">Video Poster Thumbnail:</span>
                        <label className="px-3 py-1 rounded-xl bg-orange-100 text-orange-700 text-[10px] font-bold uppercase cursor-pointer hover:bg-orange-200">
                          {item.thumbnailFile ? 'Thumbnail Selected' : 'Choose Thumbnail Image'}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => {
                              const thumbFile = e.target.files?.[0];
                              if (thumbFile) {
                                setBatchItems((prev) =>
                                  prev.map((i) =>
                                    i.id === item.id
                                      ? {
                                          ...i,
                                          thumbnailFile: thumbFile,
                                          thumbnailPreviewUrl: URL.createObjectURL(thumbFile),
                                        }
                                      : i
                                  )
                                );
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Submit Action Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-5 py-2.5 rounded-full border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={uploading || batchItems.length === 0}
                onClick={executeUpload}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-saffron-600 hover:from-orange-600 hover:to-saffron-700 text-white text-xs font-extrabold uppercase tracking-wider shadow-md disabled:opacity-50 flex items-center space-x-2 active:scale-95 transition-all"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Uploading Batch...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload {batchItems.length > 0 ? `(${batchItems.length})` : ''} Files</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>

      <AdminMobileBottomBar />
    </div>
  );
}
