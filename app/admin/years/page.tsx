'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Calendar,
  Eye,
  EyeOff,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import AdminMobileBottomBar from '@/components/AdminMobileBottomBar';
import SafeMediaImage from '@/components/SafeMediaImage';
import { toast } from '@/lib/toastStore';
import { FestivalYear } from '@/types';
import { getFestivalYears } from '@/lib/data/repository';
import { uploadImageToR2 } from '@/lib/clientStorage';

export default function AdminYearsPage() {
  const [years, setYears] = useState<FestivalYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<FestivalYear | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverDragOver, setCoverDragOver] = useState(false);

  // Form State
  const [yearNum, setYearNum] = useState<number>(new Date().getFullYear());
  const [title, setTitle] = useState('');
  const [teluguTitle, setTeluguTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    loadYears();
  }, []);

  async function loadYears() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/years', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.years && Array.isArray(data.years)) {
          setYears(data.years);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Fallback
    }

    try {
      const data = await getFestivalYears(false);
      setYears(data);
    } catch (err) {
      console.error('Failed to fetch festival years:', err);
    } finally {
      setLoading(false);
    }
  }

  const openCreateModal = () => {
    const nextYear = new Date().getFullYear() + 1;
    setEditingYear(null);
    setYearNum(nextYear);
    setTitle(`Vinayaka Chavithi ${nextYear}`);
    setTeluguTitle(`వినాయక చవితి ${nextYear}`);
    setSlug(String(nextYear));
    setDescription('');
    setCoverUrl('');
    setIsPublished(true);
    setIsModalOpen(true);
  };

  const openEditModal = (y: FestivalYear) => {
    setEditingYear(y);
    setYearNum(y.year);
    setTitle(y.title);
    setTeluguTitle(y.telugu_title || '');
    setSlug(y.slug);
    setDescription(y.description || '');
    setCoverUrl(y.cover_image_url || '');
    setIsPublished(y.is_published);
    setIsModalOpen(true);
  };

  const handleCoverFileUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.warning('Invalid File', 'Please select a valid image (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.warning('File Too Large', 'Maximum image size is 20MB.');
      return;
    }

    setUploadingCover(true);
    try {
      const { publicUrl } = await uploadImageToR2(file, 'festival-covers');
      setCoverUrl(publicUrl);
      toast.success('Cover Uploaded', 'Cover photo uploaded to Cloudflare R2.');
    } catch (err: any) {
      console.error('Cover upload error:', err);
      toast.error('Upload Failed', err.message || 'Could not upload cover image to Cloudflare R2.');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingYear ? `/api/admin/years/${editingYear.id}` : '/api/admin/years';
      const method = editingYear ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: Number(yearNum),
          title,
          telugu_title: teluguTitle,
          slug,
          description,
          cover_image_url: coverUrl || null,
          is_published: isPublished,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to save festival year');
      }

      toast.success(
        editingYear ? 'Festival Year Updated' : 'Festival Year Created',
        `Successfully saved "${title}".`
      );
      setIsModalOpen(false);
      await loadYears();
    } catch (err: any) {
      toast.error('Save Failed', err.message || 'Could not save festival year.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/years/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Festival Year Removed', 'Deleted festival year entry.');
      } else {
        throw new Error('Deletion failed');
      }
    } catch (err: any) {
      toast.error('Delete Failed', err.message || 'Could not delete festival year.');
    } finally {
      setDeleteConfirmId(null);
      loadYears();
    }
  };

  const togglePublish = async (y: FestivalYear) => {
    const nextState = !y.is_published;
    try {
      const res = await fetch(`/api/admin/years/${y.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: nextState }),
      });
      if (res.ok) {
        toast.info(
          'Publish State Updated',
          `"${y.title}" is now ${nextState ? 'Published' : 'Draft'}.`
        );
      } else {
        throw new Error('Update failed');
      }
    } catch {
      toast.error('Update Failed', 'Could not update publication state.');
    } finally {
      loadYears();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 pb-20 md:pb-0">
      <AdminHeader />

      <div className="flex-1 flex flex-col md:flex-row">
        <AdminSidebar />

        <main className="flex-1 p-3.5 sm:p-6 lg:p-10 pb-24 md:pb-8 w-full max-w-full md:ml-72 min-h-[calc(100vh-64px)]">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-orange-200 gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="font-editorial text-2xl sm:text-3xl text-slate-900 font-bold">
                  Festival Years &amp; Editions
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 font-extrabold">
                  {years.length} Editions
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Manage annual celebration archives. Each year organizes memories and chapters into a
                sacred timeline.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Festival Year</span>
            </button>
          </div>

          {/* Grid of Years */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs text-slate-500 font-medium">Loading festival editions...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {years.map((y) => (
                <div
                  key={y.id}
                  className="bg-white rounded-3xl border border-slate-200/90 hover:border-orange-400 transition-all overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md group"
                >
                  {/* Top Cover Image or Banner Header */}
                  <div className="relative w-full h-36 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 overflow-hidden">
                    {y.cover_image_url ? (
                      <SafeMediaImage
                        src={y.cover_image_url}
                        alt={y.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center opacity-20">
                        <Calendar className="w-24 h-24 text-white" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

                    {/* Year Number Badge */}
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-black/60 text-white font-editorial text-lg font-bold backdrop-blur-xs shadow-xs">
                      {y.year}
                    </div>

                    {/* Published State Badge */}
                    <div className="absolute top-3 right-3">
                      <button
                        type="button"
                        onClick={() => togglePublish(y)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-colors shadow-xs ${
                          y.is_published
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                            : 'bg-amber-500 text-white hover:bg-amber-600'
                        }`}
                        title="Click to toggle status"
                      >
                        {y.is_published ? 'Published' : 'Draft'}
                      </button>
                    </div>

                    {/* Title in bottom of banner */}
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="font-editorial text-base font-bold truncate">{y.title}</h3>
                      {y.telugu_title && (
                        <p className="text-xs text-amber-200 font-medium truncate">
                          {y.telugu_title}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {y.description ||
                        'Annual celebration edition preserved in digital memory library.'}
                    </p>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[10px] text-slate-500 font-mono">slug: /{y.slug}</span>

                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(y)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-amber-700 hover:border-amber-300 transition-colors"
                          title="Edit festival year"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(y.id)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 transition-colors"
                          title="Delete festival year"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create / Edit Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in">
              <div className="w-full max-w-lg p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-orange-300 bg-white shadow-2xl space-y-4 sm:space-y-5 max-h-[88vh] overflow-y-auto my-auto">
                <div className="flex items-center justify-between pb-3 border-b border-orange-100">
                  <h3 className="font-editorial text-xl text-slate-900 font-bold">
                    {editingYear ? 'Edit Festival Edition' : 'Add New Festival Year'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Year (e.g. 2027) *
                      </label>
                      <input
                        type="number"
                        required
                        value={yearNum}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setYearNum(val);
                          if (!editingYear) {
                            setSlug(String(val));
                            setTitle(`Vinayaka Chavithi ${val}`);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        URL Slug *
                      </label>
                      <input
                        type="text"
                        required
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Title (English) *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Title (Telugu Optional)
                    </label>
                    <input
                      type="text"
                      value={teluguTitle}
                      onChange={(e) => setTeluguTitle(e.target.value)}
                      placeholder="శ్రీ వినాయక చవితి ఉత్సవాలు..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                        Festival Cover Photo
                      </label>
                      {coverUrl && (
                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 inline mr-0.5" />
                          <span>Cloudflare R2</span>
                        </span>
                      )}
                    </div>

                    {uploadingCover ? (
                      <div className="w-full h-36 rounded-2xl border-2 border-dashed border-orange-400 bg-orange-50/50 flex flex-col items-center justify-center space-y-2">
                        <Loader2 className="w-7 h-7 text-orange-600 animate-spin" />
                        <span className="text-xs font-bold text-orange-900">
                          Uploading to Cloudflare R2...
                        </span>
                        <span className="text-[10px] text-orange-600">
                          Uploading directly from browser to R2 bucket
                        </span>
                      </div>
                    ) : coverUrl ? (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group shadow-xs">
                        <div className="relative w-full h-40">
                          <SafeMediaImage
                            src={coverUrl}
                            alt="Festival Edition Cover"
                            fill
                            className="object-cover"
                            sizes="420px"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

                          {/* Action Controls for Edit/Replace */}
                          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10 gap-2">
                            <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-slate-900 text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95">
                              <RefreshCw className="w-3.5 h-3.5 text-orange-600" />
                              <span>Replace Cover</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) handleCoverFileUpload(e.target.files[0]);
                                }}
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => setCoverUrl('')}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                              title="Remove cover image"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setCoverDragOver(true);
                        }}
                        onDragLeave={() => setCoverDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setCoverDragOver(false);
                          if (e.dataTransfer.files?.[0]) {
                            handleCoverFileUpload(e.dataTransfer.files[0]);
                          }
                        }}
                        className={`relative w-full p-6 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                          coverDragOver
                            ? 'border-orange-500 bg-orange-50/60 scale-[1.01]'
                            : 'border-slate-300 hover:border-orange-400 bg-slate-50/70 hover:bg-orange-50/30'
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          id="festivalCoverInput"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleCoverFileUpload(e.target.files[0]);
                          }}
                        />
                        <label
                          htmlFor="festivalCoverInput"
                          className="cursor-pointer flex flex-col items-center w-full"
                        >
                          <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-2 shadow-xs">
                            <Upload className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-bold text-slate-800 mb-0.5">
                            Upload Cover Photo (Cloudflare R2)
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium">
                            Click or drag &amp; drop • JPG, PNG, WEBP up to 20MB
                          </p>
                        </label>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief notes about this festival year..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="yearPublished"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300"
                    />
                    <label
                      htmlFor="yearPublished"
                      className="text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      Published (Visible in festival archive timeline)
                    </label>
                  </div>

                  <div className="pt-3 flex items-center justify-end space-x-2.5 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving || uploadingCover}
                      className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-wider shadow-md disabled:opacity-50 flex items-center space-x-2"
                    >
                      {uploadingCover ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading Cover...</span>
                        </>
                      ) : saving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : editingYear ? (
                        'Update Edition'
                      ) : (
                        'Create Edition'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteConfirmId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
              <div className="w-full max-w-sm p-6 rounded-3xl border-2 border-rose-500 bg-white text-center space-y-4 shadow-2xl">
                <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
                <h3 className="font-editorial text-2xl text-slate-900 font-bold">
                  Confirm Deletion
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Deleting this festival year will permanently remove all associated memories and
                  metadata. Are you sure?
                </p>
                <div className="flex items-center justify-center space-x-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(deleteConfirmId)}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider shadow-md"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <AdminMobileBottomBar />
    </div>
  );
}
