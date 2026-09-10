'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Sparkles,
  Camera,
  Youtube,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Play,
} from 'lucide-react';
import { toast } from '@/lib/toastStore';
import { FestivalYear, Category } from '@/types';
import { getFestivalYears, getCategories } from '@/lib/data/repository';
import CustomDropdown, { DropdownOption } from '@/components/CustomDropdown';
import { parseYouTubeUrl } from '@/lib/youtube';
import { uploadImageToR2 } from '@/lib/clientStorage';

interface UnifiedUploadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultTarget?: 'memories' | 'hero';
}

interface QuickPhotoItem {
  id: string;
  file: File;
  previewUrl: string;
  title: string;
  status: 'idle' | 'uploading' | 'success' | 'error';
}

export default function UnifiedUploadDrawer({
  isOpen,
  onClose,
  onSuccess,
  defaultTarget = 'memories',
}: UnifiedUploadDrawerProps) {
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');
  const [photoItems, setPhotoItems] = useState<QuickPhotoItem[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeTitle, setYoutubeTitle] = useState('');
  const [youtubePreview, setYoutubePreview] = useState<{
    videoId: string;
    thumbnailUrl: string;
  } | null>(null);

  // Metadata
  const [years, setYears] = useState<FestivalYear[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [isFeaturedHero, setIsFeaturedHero] = useState(defaultTarget === 'hero');

  // Status
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsFeaturedHero(defaultTarget === 'hero');
  }, [defaultTarget]);

  useEffect(() => {
    async function loadData() {
      try {
        const [yList, cList] = await Promise.all([getFestivalYears(false), getCategories()]);
        setYears(yList);
        setCategories(cList);
        if (yList.length > 0 && !selectedYearId) setSelectedYearId(yList[0].id);
        if (cList.length > 0 && !selectedCategoryId) setSelectedCategoryId(cList[0].id);
      } catch (err) {
        console.error('Failed loading drawer metadata:', err);
      }
    }
    if (isOpen) loadData();
  }, [isOpen]);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMsg(null);

    const availableSlots = 5 - photoItems.length;
    if (availableSlots <= 0) {
      toast.warning('Limit Reached', 'Maximum 5 photos per batch.');
      return;
    }

    const filesToAdd = Array.from(files).slice(0, availableSlots);
    const newItems: QuickPhotoItem[] = filesToAdd.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      status: 'idle',
    }));

    setPhotoItems((prev) => [...prev, ...newItems]);
  };

  const handleYouTubeUrlChange = (url: string) => {
    setYoutubeUrl(url);
    const parsed = parseYouTubeUrl(url);
    if (parsed) {
      setYoutubePreview({ videoId: parsed.videoId, thumbnailUrl: parsed.thumbnailUrl });
      if (!youtubeTitle) setYoutubeTitle('Festival Video Memory');
    } else {
      setYoutubePreview(null);
    }
  };

  const executeUpload = async () => {
    setErrorMsg(null);

    if (activeTab === 'photos') {
      if (photoItems.length === 0) {
        setErrorMsg('Please select at least 1 photo.');
        return;
      }
      setUploading(true);

      let successCount = 0;
      for (const item of photoItems) {
        try {
          const { publicUrl, thumbnailUrl } = await uploadImageToR2(item.file, 'photos');
          const fd = new FormData();
          fd.append('storage_path', publicUrl);
          fd.append('thumbnail_path', thumbnailUrl);
          fd.append('title', item.title.trim() || 'Festival Photo');
          fd.append('festival_year_id', selectedYearId);
          fd.append('category_id', selectedCategoryId);
          fd.append('media_type', 'image');
          fd.append('is_featured', isFeaturedHero ? 'true' : 'false');
          fd.append('is_published', 'true');

          const res = await fetch('/api/admin/memories/upload', { method: 'POST', body: fd });
          if (res.ok) successCount++;
        } catch {
          // Continue
        }
      }

      setUploading(false);
      if (successCount > 0) {
        toast.success('Upload Successful', `Uploaded ${successCount} photo(s) to Media Library.`);
        onSuccess?.();
        onClose();
        setPhotoItems([]);
      } else {
        toast.error('Upload Failed', 'Could not upload photos.');
      }
    } else {
      // YouTube Video
      if (!youtubePreview?.videoId) {
        setErrorMsg('Please enter a valid YouTube video link.');
        return;
      }
      if (!youtubeTitle.trim()) {
        setErrorMsg('Please enter a video title.');
        return;
      }

      setUploading(true);
      try {
        const fd = new FormData();
        fd.append('youtube_url', youtubeUrl);
        fd.append('title', youtubeTitle.trim());
        fd.append('festival_year_id', selectedYearId);
        fd.append('category_id', selectedCategoryId);
        fd.append('media_type', 'video');
        fd.append('is_featured', 'false');
        fd.append('is_published', 'true');

        const res = await fetch('/api/admin/memories/upload', { method: 'POST', body: fd });
        if (res.ok) {
          toast.success('Video Saved', 'Added YouTube video to Media Library.');
          onSuccess?.();
          onClose();
          setYoutubeUrl('');
          setYoutubeTitle('');
          setYoutubePreview(null);
        } else {
          throw new Error('Save failed');
        }
      } catch (err: any) {
        toast.error('Save Failed', err.message || 'Could not save video.');
      } finally {
        setUploading(false);
      }
    }
  };

  const yearOptions: DropdownOption[] = years.map((y) => ({
    value: y.id,
    label: `${y.year} - ${y.title}`,
  }));
  const categoryOptions: DropdownOption[] = categories.map((c) => ({ value: c.id, label: c.name }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-lg p-6 rounded-3xl border border-orange-300 bg-white shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-orange-100">
          <div>
            <h3 className="font-editorial text-xl font-bold text-slate-900">Quick Upload Media</h3>
            <p className="text-xs text-slate-500">
              Single Source of Truth: Cloudflare R2 &amp; YouTube
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'photos'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>📷 Photos (R2)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('videos')}
            className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'videos'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Youtube className="w-3.5 h-3.5" />
            <span>🎬 YouTube Video</span>
          </button>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
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
            <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
              Category
            </label>
            <CustomDropdown
              options={categoryOptions}
              value={selectedCategoryId}
              onChange={setSelectedCategoryId}
              lightMode={true}
            />
          </div>
        </div>

        {/* Hero Feature Switch (Photos Only) */}
        {activeTab === 'photos' && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center space-x-2">
            <input
              type="checkbox"
              id="drawerHeroToggle"
              checked={isFeaturedHero}
              onChange={(e) => setIsFeaturedHero(e.target.checked)}
              className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-amber-300"
            />
            <label
              htmlFor="drawerHeroToggle"
              className="text-xs font-bold text-slate-800 cursor-pointer select-none flex items-center space-x-1"
            >
              <Sparkles className="w-3 h-3 text-amber-600 fill-amber-600" />
              <span>Feature in Homepage Hero Carousel</span>
            </label>
          </div>
        )}

        {/* Photos Tab */}
        {activeTab === 'photos' && (
          <div className="space-y-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-200 hover:border-blue-400 rounded-2xl p-6 text-center cursor-pointer bg-blue-50/30"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <Upload className="w-6 h-6 text-blue-600 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-700">Click to choose photos</p>
              <p className="text-[10px] text-slate-500">Cloudflare R2 Direct Upload (Max 5)</p>
            </div>

            {photoItems.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {photoItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-xl border border-slate-200 flex items-center space-x-2 bg-slate-50"
                  >
                    <img src={item.previewUrl} alt="" className="w-10 h-8 object-cover rounded" />
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) =>
                        setPhotoItems((prev) =>
                          prev.map((i) => (i.id === item.id ? { ...i, title: e.target.value } : i))
                        )
                      }
                      className="flex-1 text-xs px-2 py-1 bg-white border border-slate-200 rounded"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoItems((prev) => prev.filter((i) => i.id !== item.id))}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* YouTube Tab */}
        {activeTab === 'videos' && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                YouTube Link
              </label>
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono"
              />
            </div>

            {youtubePreview && (
              <div className="flex items-center space-x-2.5 p-2 rounded-xl bg-red-50 border border-red-200">
                <div className="relative w-16 h-10 rounded overflow-hidden bg-black flex-shrink-0">
                  <img
                    src={youtubePreview.thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="w-3.5 h-3.5 text-white fill-white" />
                  </div>
                </div>
                <span className="text-[11px] text-red-700 font-bold">
                  YouTube Video ID: {youtubePreview.videoId}
                </span>
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                Video Title
              </label>
              <input
                type="text"
                placeholder="Festival Celebration Aarti..."
                value={youtubeTitle}
                onChange={(e) => setYoutubeTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              />
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
            {errorMsg}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={executeUpload}
            disabled={uploading}
            className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md cursor-pointer ${
              activeTab === 'photos'
                ? 'bg-blue-600 hover:bg-blue-500'
                : 'bg-red-600 hover:bg-red-500'
            }`}
          >
            {uploading ? 'Processing...' : activeTab === 'photos' ? 'Upload Photos' : 'Save Video'}
          </button>
        </div>
      </div>
    </div>
  );
}
