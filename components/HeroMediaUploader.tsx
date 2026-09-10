'use client';

import { useState, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Film,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Info,
  Sparkles,
  X,
  RefreshCw,
  Zap,
} from 'lucide-react';
import SafeMediaImage from './SafeMediaImage';
import { toast } from '@/lib/toastStore';
import { getHeroBucketMedia } from '@/lib/data/repository';
import { compressImageUnder50KB } from '@/lib/imageCompressor';

interface HeroMediaItem {
  url: string;
  caption: string;
  alt: string;
  isVideo?: boolean;
}

interface QueuedHeroFile {
  id: string;
  originalFile: File;
  file: File;
  previewUrl: string;
  status: 'idle' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
  isValidSize: boolean;
  wasCompressed: boolean;
  originalSizeKB: number;
  compressedSizeKB: number;
  isCompressing?: boolean;
}

export default function HeroMediaUploader() {
  const [items, setItems] = useState<HeroMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [queuedFiles, setQueuedFiles] = useState<QueuedHeroFile[]>([]);

  const MAX_SIZE_BYTES = 200 * 1024; // 200 KB limit for HD clarity

  useEffect(() => {
    loadHeroMedia();
  }, []);

  async function loadHeroMedia() {
    setLoading(true);
    try {
      const data = await getHeroBucketMedia();
      setItems(data);
    } catch (err) {
      console.error('Failed to load hero media:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleFilesSelect = async (files: FileList | File[]) => {
    const rawFiles = Array.from(files);

    const currentYear = new Date().getFullYear();
    const newItems: QueuedHeroFile[] = rawFiles.map((file, idx) => ({
      id: `HERO-${currentYear}-${String(queuedFiles.length + idx + 1).padStart(3, '0')}`,
      originalFile: file,
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'idle',
      isValidSize: file.size <= MAX_SIZE_BYTES,
      wasCompressed: false,
      originalSizeKB: file.size / 1024,
      compressedSizeKB: file.size / 1024,
      isCompressing: file.type.startsWith('image/') && file.size > MAX_SIZE_BYTES,
    }));

    setQueuedFiles((prev) => [...prev, ...newItems]);

    // Automatically compress oversized images in background
    for (const queuedItem of newItems) {
      if (
        queuedItem.originalFile.type.startsWith('image/') &&
        queuedItem.originalFile.size > MAX_SIZE_BYTES
      ) {
        try {
          const result = await compressImageUnder50KB(queuedItem.originalFile);

          setQueuedFiles((prev) =>
            prev.map((item) => {
              if (item.id === queuedItem.id) {
                return {
                  ...item,
                  file: result.compressedFile,
                  previewUrl: URL.createObjectURL(result.compressedFile),
                  isValidSize: result.compressedSizeKB <= 50,
                  wasCompressed: result.wasCompressed,
                  originalSizeKB: result.originalSizeKB,
                  compressedSizeKB: result.compressedSizeKB,
                  isCompressing: false,
                };
              }
              return item;
            })
          );

          if (result.wasCompressed) {
            toast.success(
              'Auto-Compressed for Hero Section',
              `"${queuedItem.originalFile.name}" reduced from ${result.originalSizeKB.toFixed(1)} KB ➔ ${result.compressedSizeKB.toFixed(1)} KB (WebP).`
            );
          }
        } catch (err) {
          setQueuedFiles((prev) =>
            prev.map((item) =>
              item.id === queuedItem.id ? { ...item, isCompressing: false } : item
            )
          );
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelect(e.dataTransfer.files);
    }
  };

  const removeQueuedFile = (id: string) => {
    setQueuedFiles((prev) => prev.filter((i) => i.id !== id));
  };

  const clearQueue = () => {
    setQueuedFiles([]);
  };

  const handleUploadAll = async () => {
    const validQueue = queuedFiles.filter(
      (i) => i.isValidSize && !i.isCompressing && (i.status === 'idle' || i.status === 'error')
    );
    if (validQueue.length === 0) {
      toast.error('No Valid Files', 'Please select images/videos under 50 KB to upload.');
      return;
    }

    setUploading(true);
    let successCount = 0;

    for (const item of validQueue) {
      setQueuedFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: 'uploading' } : f))
      );

      try {
        const { uploadFileWithSignedUrl } = await import('@/lib/clientStorage');
        const directHeroUrl = await uploadFileWithSignedUrl(
          item.file,
          'hero-section',
          'hero-media'
        );

        const formData = new FormData();
        formData.append('url', directHeroUrl);
        formData.append('caption', item.originalFile.name);

        const res = await fetch('/api/admin/hero/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await res.json();

        if (!res.ok || result.error) {
          throw new Error(result.error || 'Upload failed');
        }

        setQueuedFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, status: 'success' } : f))
        );
        successCount++;
      } catch (err: any) {
        setQueuedFiles((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, status: 'error', errorMessage: err.message } : f
          )
        );
      }
    }

    setUploading(false);

    if (successCount > 0) {
      toast.success(
        'Batch Hero Upload Complete!',
        `Successfully uploaded ${successCount} file(s) under 50 KB to Hero Section bucket.`
      );
      await loadHeroMedia();
    }
  };

  const validFilesCount = queuedFiles.filter(
    (i) => i.isValidSize && !i.isCompressing && i.status !== 'success'
  ).length;

  const handleDeleteHeroMedia = async (itemUrl: string, caption: string) => {
    if (!confirm(`Are you sure you want to remove "${caption}" from the Hero Section?`)) return;

    // Optimistically update UI
    setItems((prev) => prev.filter((i) => i.url !== itemUrl));

    try {
      const res = await fetch('/api/admin/hero/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: itemUrl }),
      });

      const result = await res.json();
      if (!res.ok || result.error) {
        throw new Error(result.error || 'Failed to delete file');
      }

      toast.success('Hero Slide Deleted', `Removed "${caption}" from Hero Section.`);
      await loadHeroMedia();
    } catch (err: any) {
      await loadHeroMedia();
      toast.error('Deletion Failed', err.message || 'Could not delete hero slide.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Informational Header Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-orange-50/80 border border-orange-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 rounded-xl bg-orange-100 border border-orange-300 text-orange-600 flex-shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-editorial font-bold text-slate-900">
                  Home Page Hero Banner Control Panel
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-300 text-[10px] font-bold uppercase tracking-wider">
                  Full HD Optimization
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed font-sans">
                <strong>Upload &amp; Manage Banner Slides:</strong> Upload HD photos or video clips
                directly to the home header. Images are automatically optimized for 1080p desktop
                clarity.
              </p>
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-xl bg-white border border-orange-200 text-right flex-shrink-0 shadow-xs">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Active Slides
            </span>
            <span className="text-sm font-bold text-orange-600 flex items-center justify-end space-x-1 mt-0.5">
              <span>{items.length} Slides Online</span>
            </span>
          </div>
        </div>
      </div>

      {/* Multi-File Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative p-6 sm:p-10 rounded-3xl border-2 border-dashed transition-all text-center ${
          dragActive
            ? 'border-orange-500 bg-orange-50'
            : 'border-orange-300 hover:border-orange-500 bg-white'
        }`}
      >
        <input
          type="file"
          multiple
          accept="image/*,image/jpeg,image/png,image/webp,image/avif"
          id="hero-file-input"
          className="hidden"
          onChange={(e) => e.target.files && handleFilesSelect(e.target.files)}
        />

        <label
          htmlFor="hero-file-input"
          className="cursor-pointer flex flex-col items-center justify-center space-y-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-orange-100 border border-orange-300 flex items-center justify-center text-orange-600 shadow-xs">
            <Upload className="w-7 h-7" />
          </div>

          <div>
            <span className="text-sm font-bold text-slate-900 block">
              Click to browse or drop any images/videos for Hero Section
            </span>
            <span className="text-xs text-slate-600 mt-1 block">
              Images of any resolution will be{' '}
              <strong>automatically optimized for 1080p Full HD WebP clarity</strong>.
            </span>
          </div>

          <div className="pt-2">
            <span className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-[11px] text-orange-700 font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-orange-500" />
              <span>Full HD 1080p WebP Optimization Active</span>
            </span>
          </div>
        </label>
      </div>

      {/* Queued Multi-File Upload List */}
      {queuedFiles.length > 0 && (
        <div className="p-6 rounded-3xl bg-white border-2 border-orange-200 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-orange-100">
            <div>
              <h4 className="text-base font-editorial text-slate-900 font-bold">
                Batch Upload Queue ({queuedFiles.length} files selected)
              </h4>
              <p className="text-xs text-slate-600">
                All selected images are automatically optimized for 1080p Full HD clarity before
                publishing.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={clearQueue}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider transition-all"
              >
                Clear Queue
              </button>
              <button
                type="button"
                onClick={handleUploadAll}
                disabled={uploading || validFilesCount === 0}
                className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all disabled:opacity-50 flex items-center space-x-2"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Uploading Batch...</span>
                  </>
                ) : (
                  <span>Upload {validFilesCount} File(s)</span>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {queuedFiles.map((item) => {
              const isVideo = item.file.type.startsWith('video');

              return (
                <div
                  key={item.id}
                  className={`relative rounded-2xl overflow-hidden bg-slate-50 border transition-all ${
                    item.isCompressing
                      ? 'border-orange-400 bg-orange-50/50'
                      : !item.isValidSize
                        ? 'border-rose-400 bg-rose-50/30'
                        : item.status === 'success'
                          ? 'border-emerald-400 bg-emerald-50/30'
                          : item.status === 'error'
                            ? 'border-rose-500'
                            : 'border-slate-200'
                  }`}
                >
                  <div className="relative w-full h-32 bg-slate-200">
                    {isVideo ? (
                      <video src={item.previewUrl} className="w-full h-full object-cover" />
                    ) : (
                      <SafeMediaImage
                        src={item.previewUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    )}

                    <button
                      type="button"
                      onClick={() => removeQueuedFile(item.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 hover:bg-rose-600 text-white transition-colors z-10"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-md text-[9px] font-bold text-orange-700 uppercase tracking-widest border border-orange-300 shadow-xs">
                      {isVideo ? 'FILM' : 'PHOTO'}
                    </span>
                  </div>

                  <div className="p-3 space-y-1">
                    <h5
                      className="text-xs font-bold text-slate-900 truncate"
                      title={item.originalFile.name}
                    >
                      {item.originalFile.name}
                    </h5>

                    {item.isCompressing ? (
                      <div className="flex items-center space-x-1.5 text-[10px] text-orange-600 font-semibold animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Optimizing Full HD WebP...</span>
                      </div>
                    ) : item.wasCompressed ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1 text-[10px] text-orange-700 font-bold">
                          <Zap className="w-3 h-3 text-orange-500 inline" />
                          <span>Compressed to {item.compressedSizeKB.toFixed(1)} KB</span>
                        </div>
                        <p className="text-[9px] text-slate-500 font-mono">
                          Was: {item.originalSizeKB.toFixed(1)} KB ➔ Now:{' '}
                          {item.compressedSizeKB.toFixed(1)} KB
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[10px]">
                        <span
                          className={`font-bold ${item.isValidSize ? 'text-emerald-700' : 'text-rose-600'}`}
                        >
                          {item.compressedSizeKB.toFixed(1)} KB {item.isValidSize ? '✓ HD' : '✕'}
                        </span>

                        {item.status === 'uploading' && (
                          <span className="text-orange-600 font-bold animate-pulse">
                            Uploading...
                          </span>
                        )}
                        {item.status === 'success' && (
                          <span className="text-emerald-700 font-bold flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 inline text-emerald-600" />
                            <span>Uploaded</span>
                          </span>
                        )}
                        {item.status === 'error' && (
                          <span className="text-rose-600 font-bold">Failed</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Hero Bucket Media Gallery Grid with Instant Deletion */}
      <div className="p-6 rounded-3xl bg-white border-2 border-orange-200 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-orange-100">
          <div>
            <h4 className="text-base font-editorial text-slate-900 font-bold">
              Active Home Hero Slides
            </h4>
            <p className="text-xs text-slate-600">
              Currently live slides in the home page header banner.
            </p>
          </div>
          <span className="text-xs text-orange-600 font-mono font-bold">
            {items.length} {items.length === 1 ? 'Slide' : 'Slides'} Active
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Loading hero bucket items...
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No custom media uploaded to{' '}
            <code className="text-orange-600 font-mono font-bold">Hero Section</code> bucket yet.
            <br />
            (Home page is using the default curated village Ganesha visuals).
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((item, idx) => {
              const isVideo = item.isVideo || /\.(mp4|webm|ogg|mov|m4v)$/i.test(item.url);
              return (
                <div
                  key={item.url + idx}
                  className="relative rounded-2xl overflow-hidden bg-slate-50 border border-orange-200 group hover:border-orange-500 transition-all shadow-xs"
                >
                  <div className="relative w-full h-40 bg-slate-200">
                    {isVideo ? (
                      <video src={item.url} controls className="w-full h-full object-cover" />
                    ) : (
                      <SafeMediaImage src={item.url} alt={item.alt} fill className="object-cover" />
                    )}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-md text-[9px] font-bold text-orange-700 uppercase tracking-widest border border-orange-300 shadow-xs">
                      {isVideo ? 'FILM' : 'PHOTO'}
                    </span>

                    {/* Quick Delete Overlay Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteHeroMedia(item.url, item.caption)}
                      title="Delete this hero slide"
                      className="absolute top-2 right-2 p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 opacity-0 group-hover:opacity-100 transition-all shadow-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-3.5 flex items-center justify-between">
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-slate-900 truncate">{item.caption}</h5>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate font-mono">
                        {item.url}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteHeroMedia(item.url, item.caption)}
                      className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 transition-colors flex-shrink-0 ml-2"
                      title="Delete slide"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
