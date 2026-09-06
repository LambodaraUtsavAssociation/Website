'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, Check, Film, FileImage, AlertCircle, RefreshCw } from 'lucide-react';
import { Category, FestivalYear, MediaType } from '@/types';

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

export default function MediaUploader({ years, categories, onUploadSuccess }: MediaUploaderProps) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultYearId = years[0]?.id || '';
  const defaultCategoryId = categories[0]?.id || '';

  const handleFiles = (files: FileList | File[]) => {
    const newItems: UploadItem[] = [];

    Array.from(files).forEach((file) => {
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
        id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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
      // Simulate progress step
      await new Promise((res) => setTimeout(res, 400));
      updateItemField(item.id, 'progress', 60);

      // Create payload data
      const formData = new FormData();
      formData.append('file', item.file);
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
    } catch (err: any) {
      updateItemField(item.id, 'status', 'error');
      updateItemField(item.id, 'errorMessage', err.message || 'Upload failed');
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
            ? 'border-saffron-500 bg-saffron-500/10 scale-[1.01]'
            : 'border-charcoal-700 bg-charcoal-900/60 hover:border-gold-500/40 hover:bg-charcoal-850'
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
        <div className="w-16 h-16 rounded-full bg-saffron-600/20 border border-saffron-500/30 text-saffron-400 flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8" />
        </div>
        <h3 className="font-editorial text-2xl text-ivory-50 font-normal mb-2">
          Drag &amp; Drop Festival Photos and Videos
        </h3>
        <p className="text-xs text-ivory-400 max-w-md mx-auto mb-4 leading-relaxed">
          Supports high resolution JPEG, PNG, WebP, AVIF images (up to 15MB) and MP4, WebM video clips (up to 100MB). Batch selection enabled.
        </p>
        <button
          type="button"
          className="px-6 py-2.5 rounded-full bg-charcoal-800 border border-charcoal-700 text-ivory-200 text-xs font-medium hover:text-gold-400 hover:border-gold-500/40 transition-colors"
        >
          Select Files from Computer
        </button>
      </div>

      {/* Selected Items List */}
      {items.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-charcoal-800">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-ivory-100">
              Selected Batch Media ({items.length} files)
            </h4>

            <button
              onClick={handleUploadAll}
              disabled={items.every((i) => i.status === 'success')}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-saffron-600 to-saffron-700 hover:from-saffron-500 hover:to-saffron-600 text-ivory-50 text-xs font-medium shadow-glow-saffron disabled:opacity-50 transition-all flex items-center space-x-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Publish Selected Batch</span>
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="glass-panel p-4 rounded-2xl border border-charcoal-700 flex flex-col md:flex-row gap-4 items-start md:items-center"
              >
                {/* Media Preview Thumbnail */}
                <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-black flex-shrink-0">
                  {item.mediaType === 'video' ? (
                    <video src={item.previewUrl} className="w-full h-full object-cover" />
                  ) : (
                    <Image src={item.previewUrl} alt={item.title} fill className="object-cover" />
                  )}
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-ivory-200 uppercase">
                    {item.mediaType}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
                  <div>
                    <label className="text-[10px] text-ivory-400 uppercase tracking-wider block mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateItemField(item.id, 'title', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-charcoal-900 border border-charcoal-700 text-xs text-ivory-100 focus:outline-none focus:border-gold-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-ivory-400 uppercase tracking-wider block mb-1">
                      Chapter Category
                    </label>
                    <select
                      value={item.categoryId}
                      onChange={(e) => updateItemField(item.id, 'categoryId', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-charcoal-900 border border-charcoal-700 text-xs text-ivory-100 focus:outline-none focus:border-gold-500"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-ivory-400 uppercase tracking-wider block mb-1">
                      Festival Year
                    </label>
                    <select
                      value={item.festivalYearId}
                      onChange={(e) => updateItemField(item.id, 'festivalYearId', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-charcoal-900 border border-charcoal-700 text-xs text-ivory-100 focus:outline-none focus:border-gold-500"
                    >
                      {years.map((y) => (
                        <option key={y.id} value={y.id}>
                          {y.year} - {y.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-ivory-400 uppercase tracking-wider block mb-1">
                      Capture Date
                    </label>
                    <input
                      type="date"
                      value={item.captureDate}
                      onChange={(e) => updateItemField(item.id, 'captureDate', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-charcoal-900 border border-charcoal-700 text-xs text-ivory-100 focus:outline-none focus:border-gold-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-ivory-400 uppercase tracking-wider block mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      placeholder="Brief emotional context..."
                      value={item.description}
                      onChange={(e) => updateItemField(item.id, 'description', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-charcoal-900 border border-charcoal-700 text-xs text-ivory-100 focus:outline-none focus:border-gold-500"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-center space-x-4 pt-4">
                    <label className="flex items-center space-x-2 text-xs text-ivory-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.isFeatured}
                        onChange={(e) => updateItemField(item.id, 'isFeatured', e.target.checked)}
                        className="rounded border-charcoal-700 text-saffron-600 focus:ring-0"
                      />
                      <span>Mark as Featured</span>
                    </label>

                    <label className="flex items-center space-x-2 text-xs text-ivory-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.isPublished}
                        onChange={(e) => updateItemField(item.id, 'isPublished', e.target.checked)}
                        className="rounded border-charcoal-700 text-saffron-600 focus:ring-0"
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
                    className="p-1 rounded text-ivory-400 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {item.status === 'uploading' && (
                    <div className="w-24 text-right">
                      <div className="w-full bg-charcoal-800 h-1.5 rounded-full overflow-hidden mb-1">
                        <div
                          className="bg-saffron-500 h-full transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-ivory-400">Uploading...</span>
                    </div>
                  )}

                  {item.status === 'success' && (
                    <span className="inline-flex items-center space-x-1 text-xs text-green-400 font-medium">
                      <Check className="w-3.5 h-3.5" />
                      <span>Published</span>
                    </span>
                  )}

                  {item.status === 'error' && (
                    <button
                      onClick={() => processUpload(item)}
                      className="inline-flex items-center space-x-1 text-xs text-red-400 hover:underline"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
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
