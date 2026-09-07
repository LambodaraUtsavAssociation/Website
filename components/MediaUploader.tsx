'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, Check, Film, FileImage, AlertCircle, RefreshCw } from 'lucide-react';
import { Category, FestivalYear, MediaType } from '@/types';

import { toast } from '@/lib/toastStore';

interface UploadItem {
  id: string;
  file: File;
  previewUrl: string;
  mediaType: MediaType;
  title: string;
  description: string;
  categoryId: string;
  festivalYearId: string;
  captureDate: string;
  isFeatured: boolean;
  isPublished: boolean;
  customThumbnailFile?: File;
  customThumbnailPreviewUrl?: string;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

interface MediaUploaderProps {
  years: FestivalYear[];
  categories: Category[];
  onUploadSuccess: () => void;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

async function generateVideoThumbnail(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      const url = URL.createObjectURL(file);
      video.src = url;

      video.onloadeddata = () => {
        video.currentTime = Math.min(1.0, (video.duration || 2) / 2);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(
              (blob) => {
                URL.revokeObjectURL(url);
                resolve(blob);
              },
              'image/webp',
              0.85
            );
          } else {
            URL.revokeObjectURL(url);
            resolve(null);
          }
        } catch {
          URL.revokeObjectURL(url);
          resolve(null);
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

export default function MediaUploader({ years, categories, onUploadSuccess }: MediaUploaderProps) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultYearId = years[0]?.id || '';
  const defaultCategoryId = categories[0]?.id || '';

  const handleFiles = (files: FileList | File[]) => {
    const newItems: UploadItem[] = [];

    Array.from(files).forEach((file, index) => {
      const isImg = ALLOWED_IMAGE_TYPES.includes(file.type);
      const isVid = ALLOWED_VIDEO_TYPES.includes(file.type);

      if (!isImg && !isVid) {
        alert(`File format "${file.name}" is not supported. Please upload JPEG, PNG, WebP, AVIF, MP4, or WebM.`);
        return;
      }

      const maxSize = isImg ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
      if (file.size > maxSize) {
        alert(`File "${file.name}" exceeds maximum allowed size (${isImg ? '15MB' : '100MB'}).`);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      newItems.push({
        id: `UPLOAD-${String(items.length + index + 1).padStart(3, '0')}`,
        file,
        previewUrl,
        mediaType: isVid ? 'video' : 'image',
        title: cleanTitle,
        description: '',
        categoryId: defaultCategoryId,
        festivalYearId: defaultYearId,
        captureDate: new Date().toISOString().split('T')[0],
        isFeatured: false,
        isPublished: true,
        progress: 0,
        status: 'idle',
      });
    });

    setItems((prev) => [...prev, ...newItems]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItemField = (id: string, field: keyof UploadItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const processUpload = async (item: UploadItem) => {
    updateItemField(item.id, 'status', 'uploading');
    updateItemField(item.id, 'progress', 20);

    try {
      // Handle custom thumbnail or auto-generated video thumbnail
      let thumbnailBlob: Blob | null = null;
      if (item.customThumbnailFile) {
        thumbnailBlob = item.customThumbnailFile;
      } else if (item.mediaType === 'video') {
        thumbnailBlob = await generateVideoThumbnail(item.file);
      }

      updateItemField(item.id, 'progress', 40);

      // Direct client storage upload for memories (photos & videos of ANY size)
      const { uploadFileToSupabaseStorage } = await import('@/lib/clientStorage');
      const directStorageUrl = await uploadFileToSupabaseStorage(item.file, 'festival-media', `${item.mediaType}s`);
      let directThumbUrl: string | null = null;
      if (thumbnailBlob && thumbnailBlob instanceof File) {
        directThumbUrl = await uploadFileToSupabaseStorage(thumbnailBlob, 'festival-media', 'thumbnails');
      }

      updateItemField(item.id, 'progress', 80);

      // Create payload data
      const formData = new FormData();
      if (directStorageUrl) {
        formData.append('storage_path', directStorageUrl);
        if (directThumbUrl) formData.append('thumbnail_path', directThumbUrl);
      } else {
        formData.append('file', item.file);
        if (thumbnailBlob) {
          formData.append('thumbnail', thumbnailBlob, item.customThumbnailFile ? item.customThumbnailFile.name : 'thumbnail.webp');
        }
      }
      formData.append('title', item.title);
      formData.append('description', item.description);
      formData.append('category_id', item.categoryId);
      formData.append('festival_year_id', item.festivalYearId);
      formData.append('capture_date', item.captureDate);
      formData.append('media_type', item.mediaType);
      formData.append('is_featured', String(item.isFeatured));
      formData.append('is_published', String(item.isPublished));

      const response = await fetch('/api/admin/memories/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      updateItemField(item.id, 'progress', 100);
      updateItemField(item.id, 'status', 'success');
      toast.success('Media Published', `Published "${item.title}" to digital gallery.`);
    } catch (err: any) {
      updateItemField(item.id, 'status', 'error');
      updateItemField(item.id, 'errorMessage', err.message || 'Upload failed');
      toast.error('Upload Error', err.message || 'Failed to upload media file.');
    }
  };

  const handleUploadAll = async () => {
    const pending = items.filter((i) => i.status === 'idle' || i.status === 'error');
    for (const item of pending) {
      await processUpload(item);
    }
    onUploadSuccess();
  };

  return (
    <div className="space-y-6">
      {/* Informational Header Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-orange-50/80 border border-orange-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 rounded-xl bg-orange-100 border border-orange-300 text-orange-600 flex-shrink-0">
              <FileImage className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-editorial font-bold text-slate-900">
                  Festival Gallery Memories Upload Screen
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-300 text-[10px] font-bold uppercase tracking-wider">
                  Target Bucket: festival-media
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed font-sans">
                <strong>What goes here:</strong> Ritual photos and video clips associated with specific <strong>Festival Years</strong> (e.g. 2026, 2025) and <strong>Categories</strong> (e.g. Aarti, Procession). These appear on public gallery pages.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-orange-500 bg-orange-50 scale-[1.01]'
            : 'border-orange-300 bg-white hover:border-orange-500 hover:bg-orange-50/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <div className="w-16 h-16 rounded-2xl bg-orange-100 border border-orange-300 text-orange-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
          <Upload className="w-8 h-8" />
        </div>
        <h3 className="font-editorial text-2xl text-slate-900 font-bold mb-2">
          Drag &amp; Drop Festival Photos and Videos
        </h3>
        <p className="text-xs text-slate-600 max-w-md mx-auto mb-4 leading-relaxed font-medium">
          Supports high resolution JPEG, PNG, WebP, AVIF images (up to 15MB) and MP4, WebM video clips (up to 100MB). Batch selection enabled.
        </p>
        <button
          type="button"
          className="px-6 py-2.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider hover:bg-orange-100 transition-colors shadow-xs"
        >
          Select Files from Computer
        </button>
      </div>

      {/* Selected Items List */}
      {items.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-orange-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-orange-100">
            <div>
              <h4 className="text-base font-editorial text-slate-900 font-bold">
                Batch Upload Queue ({items.length} files selected)
              </h4>
              <p className="text-xs text-slate-600">
                Configure details for multiple files below before publishing.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setItems([])}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider transition-all"
              >
                Clear Queue
              </button>
              <button
                onClick={handleUploadAll}
                disabled={items.every((i) => i.status === 'success')}
                className="px-6 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 border border-orange-600 text-white text-xs font-bold uppercase tracking-wider shadow-md disabled:opacity-50 transition-all flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Publish Batch ({items.filter((i) => i.status !== 'success').length})</span>
              </button>
            </div>
          </div>

          {/* Quick Bulk Tagging Bar */}
          <div className="p-3.5 rounded-2xl bg-orange-50/80 border border-orange-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <span className="text-orange-700 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1">
              <span>Quick Bulk Tagging (Apply to All {items.length} files):</span>
            </span>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    setItems((prev) => prev.map((i) => ({ ...i, festivalYearId: e.target.value })));
                    toast.info('Bulk Year Applied', 'Updated festival year for all queued items.');
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-white border border-orange-200 text-slate-900 text-xs font-semibold focus:border-orange-500"
              >
                <option value="">-- Apply Year to All --</option>
                {years.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.year} - {y.title}
                  </option>
                ))}
              </select>

              <select
                onChange={(e) => {
                  if (e.target.value) {
                    setItems((prev) => prev.map((i) => ({ ...i, categoryId: e.target.value })));
                    toast.info('Bulk Category Applied', 'Updated category for all queued items.');
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-white border border-orange-200 text-slate-900 text-xs font-semibold focus:border-orange-500"
              >
                <option value="">-- Apply Category to All --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white border-2 border-orange-200 flex flex-col md:flex-row gap-4 items-start md:items-center shadow-xs"
              >
                {/* Media Preview Thumbnail */}
                <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0 border border-orange-200">
                  {item.mediaType === 'video' ? (
                    <video src={item.previewUrl} className="w-full h-full object-cover" />
                  ) : (
                    <Image src={item.previewUrl} alt={item.title} fill className="object-cover" />
                  )}
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-white/90 text-[9px] text-orange-700 font-bold uppercase border border-orange-300 shadow-xs">
                    {item.mediaType}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
                  <div>
                    <label className="text-[10px] text-orange-700 font-bold uppercase tracking-wider block mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateItemField(item.id, 'title', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-orange-700 font-bold uppercase tracking-wider block mb-1">
                      Chapter Category
                    </label>
                    <select
                      value={item.categoryId}
                      onChange={(e) => updateItemField(item.id, 'categoryId', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-orange-700 font-bold uppercase tracking-wider block mb-1">
                      Festival Year
                    </label>
                    <select
                      value={item.festivalYearId}
                      onChange={(e) => updateItemField(item.id, 'festivalYearId', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                    >
                      {years.map((y) => (
                        <option key={y.id} value={y.id}>
                          {y.year} - {y.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-orange-700 font-bold uppercase tracking-wider block mb-1">
                      Capture Date
                    </label>
                    <input
                      type="date"
                      value={item.captureDate}
                      onChange={(e) => updateItemField(item.id, 'captureDate', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-orange-700 font-bold uppercase tracking-wider block mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      placeholder="Brief emotional context..."
                      value={item.description}
                      onChange={(e) => updateItemField(item.id, 'description', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {item.mediaType === 'video' && (
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-orange-700 font-bold uppercase tracking-wider block mb-1">
                        Video Cover Thumbnail Image (Optional)
                      </label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        onChange={(e) => {
                          const thumb = e.target.files?.[0];
                          if (thumb) {
                            const thumbUrl = URL.createObjectURL(thumb);
                            updateItemField(item.id, 'customThumbnailFile', thumb);
                            updateItemField(item.id, 'customThumbnailPreviewUrl', thumbUrl);
                          }
                        }}
                        className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-300 text-[11px] text-slate-800 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 cursor-pointer"
                      />
                      {item.customThumbnailFile && (
                        <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                          ✓ Selected custom cover image: {item.customThumbnailFile.name}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="sm:col-span-2 flex items-center space-x-4 pt-4">
                    <label className="flex items-center space-x-2 text-xs text-slate-700 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.isFeatured}
                        onChange={(e) => updateItemField(item.id, 'isFeatured', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span>Mark as Featured</span>
                    </label>

                    <label className="flex items-center space-x-2 text-xs text-slate-700 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.isPublished}
                        onChange={(e) => updateItemField(item.id, 'isPublished', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span>Publish Immediately</span>
                    </label>
                  </div>
                </div>

                {/* Upload Status & Actions */}
                <div className="flex flex-col items-end space-y-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {item.status === 'uploading' && (
                    <div className="w-24 text-right">
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-1">
                        <div
                          className="bg-orange-500 h-full transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-orange-600 font-bold">Uploading...</span>
                    </div>
                  )}

                  {item.status === 'success' && (
                    <span className="inline-flex items-center space-x-1 text-xs text-emerald-700 font-bold">
                      <Check className="w-3.5 h-3.5" />
                      <span>Published</span>
                    </span>
                  )}

                  {item.status === 'error' && (
                    <div className="flex flex-col items-end space-y-1">
                      <span className="text-[10px] text-rose-600 font-bold max-w-[140px] truncate" title={item.errorMessage}>
                        {item.errorMessage || 'Upload failed'}
                      </span>
                      <button
                        onClick={() => processUpload(item)}
                        className="inline-flex items-center space-x-1 text-xs text-rose-600 hover:underline font-bold"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
