'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X,
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
} from 'lucide-react';
import { toast } from '@/lib/toastStore';
import { FestivalYear, Category } from '@/types';
import { getFestivalYears, getCategories } from '@/lib/data/repository';
import CustomDropdown, { DropdownOption } from '@/components/CustomDropdown';

interface UnifiedUploadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultTarget?: 'memories' | 'hero';
}

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

export default function UnifiedUploadDrawer({
  isOpen,
  onClose,
  onSuccess,
  defaultTarget = 'memories',
}: UnifiedUploadDrawerProps) {
  const [targetSection, setTargetSection] = useState<'memories' | 'hero'>(defaultTarget);
  const [batchItems, setBatchItems] = useState<UploadBatchItem[]>([]);

  // Memory Specific Shared Fields
  const [years, setYears] = useState<FestivalYear[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [captureDate, setCaptureDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  // Status & Error States
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTargetSection(defaultTarget);
  }, [defaultTarget, isOpen]);

  useEffect(() => {
    async function loadData() {
      try {
        const [yList, cList] = await Promise.all([getFestivalYears(), getCategories()]);
        setYears(yList);
        setCategories(cList);
        if (yList.length > 0 && !selectedYearId) {
          setSelectedYearId(yList[0].id);
        }
        if (cList.length > 0 && !selectedCategoryId) {
          setSelectedCategoryId(cList[0].id);
        }
      } catch (err) {
        console.error('Failed loading drawer metadata:', err);
      }
    }
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Recalculate generated IDs whenever year or target section changes
  const currentYearObj = years.find((y) => y.id === selectedYearId);
  const yearNumber = currentYearObj ? String(currentYearObj.year) : new Date().getFullYear().toString();

  const handleFilesSelect = (fileList: FileList | File[]) => {
    setErrorMsg(null);
    const selectedArray = Array.from(fileList);
    let validFiles = selectedArray;

    if (targetSection === 'hero') {
      const videoFiles = selectedArray.filter((f) => f.type.startsWith('video/') || /\.(mp4|webm|ogg|mov|m4v|avi|mkv)$/i.test(f.name));
      if (videoFiles.length > 0) {
        toast.warning(
          'Photos Only for Hero',
          'Hero Section supports photo images only. Selected video clips were skipped. Choose "Memory" target for video clips.'
        );
      }
      validFiles = selectedArray.filter((f) => !f.type.startsWith('video/') && !/\.(mp4|webm|ogg|mov|m4v|avi|mkv)$/i.test(f.name));
    }

    if (validFiles.length === 0) return;

    const remainingSlots = MAX_BATCH_SIZE - batchItems.length;
    if (remainingSlots <= 0) {
      toast.warning('Batch Limit Reached', 'Maximum 5 files can be uploaded at a time.');
      return;
    }

    if (validFiles.length > remainingSlots) {
      toast.warning(
        'Max 5 Files Limit',
        `You can upload up to 5 files at a time. Added first ${remainingSlots} selected file(s).`
      );
    }

    const filesToAdd = validFiles.slice(0, remainingSlots);

    const newQueueItems: UploadBatchItem[] = filesToAdd.map((f, idx) => {
      const isVid = f.type.startsWith('video/') || /\.(mp4|webm|ogg|mov|m4v|avi|mkv)$/i.test(f.name);
      const cleanName = f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const totalIdx = batchItems.length + idx + 1;
      const seqStr = String(totalIdx).padStart(3, '0');
      const genId = targetSection === 'memories' ? `MEM-${yearNumber}-${seqStr}` : `HERO-${yearNumber}-${seqStr}`;

      return {
        id: `batch-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
        file: f,
        previewUrl: URL.createObjectURL(f),
        mediaType: isVid ? 'video' : 'image',
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
      // Recalculate IDs for remaining items
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

  const handleClose = () => {
    if (uploading) return;
    handleReset();
    onClose();
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
    const errors: string[] = [];

    for (let index = 0; index < batchItems.length; index++) {
      const item = batchItems[index];

      // Skip files already uploaded successfully in previous attempt
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
        const msg = err.message || 'Upload error';
        errors.push(`${item.file.name}: ${msg}`);
        setBatchItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: 'error', errorMessage: msg } : i))
        );
      }
    }

    setUploading(false);

    if (failCount === 0 && successCount > 0) {
      toast.success(
        'Batch Upload Complete!',
        `Successfully uploaded ${successCount} file(s) with memorable IDs assigned.`
      );
      onSuccess?.();
      handleClose();
    } else {
      // IF ANY FAILED: STAY OPEN AND DISPLAY ERROR + RETRY OPTION!
      setErrorMsg(
        `${failCount} of ${batchItems.length} upload(s) failed. Check details below and click Retry.`
      );
    }
  };

  if (!isOpen) return null;

  const targetOptions: DropdownOption[] = [
    { value: 'memories', label: 'Memory' },
    { value: 'hero', label: 'Hero' },
  ];

  const yearOptions: DropdownOption[] = years.map((y) => ({
    value: y.id,
    label: `${y.year} - ${y.title || 'Festival Year'}`,
  }));

  const categoryOptions: DropdownOption[] = [
    { value: '', label: 'General / Uncategorized' },
    ...categories.map((c) => ({
      value: c.id,
      label: c.name,
    })),
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={handleClose}
      />

      {/* Right Slide-over Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white border-l-4 border-orange-500 shadow-2xl flex flex-col justify-between animate-slide-in-right">
          {/* Header */}
          <div className="p-6 bg-slate-50 border-b border-orange-200 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-orange-100 border border-orange-300 text-orange-600">
                  <Upload className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-xl font-bold font-editorial text-slate-900">
                    Batch Media Uploader
                  </h2>
                  <p className="text-xs text-slate-600">
                    Upload up to <strong className="text-orange-600 font-bold">5 files</strong> at a time with auto-generated IDs.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleClose}
              disabled={uploading}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            {/* Inline Error Alert Banner with Retry Option */}
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-300 text-red-800 text-xs space-y-3 shadow-xs animate-shake">
                <div className="flex items-start space-x-2.5">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold text-red-900 block mb-0.5">Upload Issues Detected</span>
                    <p>{errorMsg}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-red-200 flex justify-end">
                  <button
                    type="button"
                    onClick={executeUpload}
                    disabled={uploading}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${uploading ? 'animate-spin' : ''}`} />
                    <span>Retry Failed Uploads</span>
                  </button>
                </div>
              </div>
            )}

            {/* Target Destination Selector Dropdown */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                1. Select Target Destination
              </label>
              <CustomDropdown
                options={targetOptions}
                value={targetSection}
                onChange={(val) => setTargetSection(val as 'memories' | 'hero')}
                lightMode={true}
                icon={<Sparkles className="w-4 h-4 text-orange-500" />}
              />
              <div className="mt-2 p-2.5 rounded-xl bg-orange-50/80 border border-orange-200 flex items-center justify-between text-xs text-orange-800">
                <span className="font-medium">Selected Batch Count:</span>
                <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-orange-300 text-orange-700">
                  {batchItems.length} / {MAX_BATCH_SIZE} Files Selected
                </span>
              </div>
            </div>

            {/* Drag & Drop File Selector (Up to 5) */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                2. Choose Media Files (Max 5)
              </label>

              {batchItems.length < MAX_BATCH_SIZE && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-orange-300 hover:border-orange-500 rounded-2xl p-6 text-center bg-slate-50 hover:bg-orange-50/40 transition-all cursor-pointer group mb-4"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={
                      targetSection === 'hero'
                        ? 'image/jpeg,image/png,image/webp,image/avif,image/*'
                        : 'image/*,video/*,video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v'
                    }
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFilesSelect(e.target.files);
                      }
                    }}
                  />
                  <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-300 text-orange-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <Plus className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Click or Drag &amp; Drop up to {MAX_BATCH_SIZE - batchItems.length} more file(s)
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    {targetSection === 'hero'
                      ? 'Hero Section supports photo images only (JPEG, PNG, WebP, AVIF)'
                      : 'Supports Photos (JPEG, PNG, WebP) & Video Films (MP4, WebM, MOV)'}
                  </p>
                </div>
              )}

              {/* Selected Files Queue List */}
              {batchItems.length > 0 && (
                <div className="space-y-3">
                  {batchItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border-2 transition-all space-y-2 ${
                        item.status === 'error'
                          ? 'bg-red-50/50 border-red-300'
                          : item.status === 'success'
                          ? 'bg-emerald-50/50 border-emerald-300'
                          : 'bg-white border-orange-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 min-w-0">
                          {item.previewUrl && item.mediaType === 'image' ? (
                            <img
                              src={item.previewUrl}
                              alt="Preview"
                              className="w-12 h-12 rounded-xl object-cover border border-orange-200 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 flex-shrink-0">
                              {item.mediaType === 'video' ? <Film className="w-5 h-5" /> : <Images className="w-5 h-5" />}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-0.5 rounded bg-orange-100 border border-orange-300 text-orange-800 text-[10px] font-mono font-bold">
                                {item.generatedId}
                              </span>
                              <span className="text-[10px] uppercase font-bold text-slate-400">
                                File #{idx + 1}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-slate-900 truncate mt-0.5">{item.file.name}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {item.status === 'uploading' && (
                            <span className="text-[10px] font-bold text-orange-600 flex items-center space-x-1">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Uploading...</span>
                            </span>
                          )}
                          {item.status === 'success' && (
                            <span className="text-[10px] font-bold text-emerald-700 flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Uploaded</span>
                            </span>
                          )}
                          {item.status === 'error' && (
                            <span className="text-[10px] font-bold text-red-600 flex items-center space-x-1">
                              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                              <span>Failed</span>
                            </span>
                          )}

                          {!uploading && item.status !== 'success' && (
                            <button
                              type="button"
                              onClick={() => removeBatchItem(item.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Remove file"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Memory Specific Editable Title & Cover Thumbnail per file */}
                      {targetSection === 'memories' && item.status !== 'success' && (
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                          <input
                            type="text"
                            required
                            value={item.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBatchItems((prev) =>
                                prev.map((i) => (i.id === item.id ? { ...i, title: val } : i))
                              );
                            }}
                            placeholder="Enter Memory Title *"
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-orange-500"
                          />

                          {/* Cover Poster / Thumbnail Image File Upload */}
                          <div className="flex items-center justify-between bg-orange-50/60 p-2.5 rounded-xl border border-orange-200 gap-2">
                            <div className="flex items-center space-x-2.5 min-w-0">
                              {item.thumbnailPreviewUrl ? (
                                <img
                                  src={item.thumbnailPreviewUrl}
                                  alt="Thumbnail"
                                  className="w-9 h-9 rounded-lg object-cover border border-orange-300 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-white border border-orange-300 flex items-center justify-center text-orange-500 flex-shrink-0 shadow-2xs">
                                  <Camera className="w-4 h-4" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="text-[11px] font-bold text-orange-900 block truncate">
                                  {item.thumbnailFile
                                    ? item.thumbnailFile.name
                                    : item.mediaType === 'video'
                                    ? 'Upload Cover Poster Image'
                                    : 'Upload Custom Cover Thumbnail (Optional)'}
                                </span>
                                <span className="text-[9px] text-slate-500 block">
                                  {item.thumbnailFile
                                    ? `${(item.thumbnailFile.size / 1024).toFixed(1)} KB`
                                    : 'Attach custom cover image file'}
                                </span>
                              </div>
                            </div>

                            <label className="px-3 py-1.5 rounded-lg bg-white border border-orange-300 hover:bg-orange-100 text-orange-700 text-[10px] font-bold uppercase tracking-wider cursor-pointer flex-shrink-0 shadow-2xs transition-colors">
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/avif"
                                className="hidden"
                                onChange={(e) => {
                                  const thumb = e.target.files?.[0];
                                  if (thumb) {
                                    setBatchItems((prev) =>
                                      prev.map((i) =>
                                        i.id === item.id
                                          ? {
                                              ...i,
                                              thumbnailFile: thumb,
                                              thumbnailPreviewUrl: URL.createObjectURL(thumb),
                                            }
                                          : i
                                      )
                                    );
                                  }
                                }}
                              />
                              <span>{item.thumbnailFile ? 'Change Cover' : 'Choose Cover Image'}</span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Target-Specific Form Metadata (Only required for Memories) */}
            {targetSection === 'memories' && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  3. Shared Memory Settings
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Festival Year
                    </label>
                    <CustomDropdown
                      options={yearOptions}
                      value={selectedYearId}
                      onChange={setSelectedYearId}
                      lightMode={true}
                      icon={<Calendar className="w-3.5 h-3.5 text-orange-500" />}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Category / Chapter
                    </label>
                    <CustomDropdown
                      options={categoryOptions}
                      value={selectedCategoryId}
                      onChange={setSelectedCategoryId}
                      lightMode={true}
                      icon={<Tag className="w-3.5 h-3.5 text-orange-500" />}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Capture Date
                  </label>
                  <input
                    type="date"
                    value={captureDate}
                    onChange={(e) => setCaptureDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add details about the ritual, venue, or attendees..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                  />
                </div>

                <label className="flex items-center space-x-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 accent-orange-500 rounded"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Feature on Home Page Spotlight
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Drawer Action Footer */}
          <div className="p-6 bg-slate-50 border-t border-orange-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={uploading}
              className="px-5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={executeUpload}
              disabled={uploading || batchItems.length === 0}
              className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-orange-500/20 disabled:opacity-50 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Processing Uploads...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Upload {batchItems.length > 0 ? `(${batchItems.length} File${batchItems.length === 1 ? '' : 's'})` : ''}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
