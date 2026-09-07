'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Edit2, Trash2, X, AlertTriangle, Upload, Camera } from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import AdminMobileBottomBar from '@/components/AdminMobileBottomBar';
import UnifiedUploadDrawer from '@/components/UnifiedUploadDrawer';
import SafeMediaImage from '@/components/SafeMediaImage';
import { toast } from '@/lib/toastStore';
import { FestivalYear } from '@/types';
import { getFestivalYears } from '@/lib/data/repository';

export default function AdminYearsPage() {
  const [years, setYears] = useState<FestivalYear[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<FestivalYear | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [isUploadDrawerOpen, setIsUploadDrawerOpen] = useState(false);


  // Form State
  const [yearNum, setYearNum] = useState<number>(2027);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    loadYears();
  }, []);

  async function loadYears() {
    const data = await getFestivalYears(false);
    setYears(data);
  }

  const openCreateModal = () => {
    setEditingYear(null);
    setYearNum(2027);
    setTitle('Vinayaka Chavithi 2027');
    setSlug('2027');
    setDescription('');
    setCoverUrl('');
    setIsPublished(true);
    setIsModalOpen(true);
  };

  const openEditModal = (y: FestivalYear) => {
    setEditingYear(y);
    setYearNum(y.year);
    setTitle(y.title);
    setSlug(y.slug);
    setDescription(y.description || '');
    setCoverUrl(y.cover_image_url || '');
    setIsPublished(y.is_published);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingYear) {
      // Update
      await fetch(`/api/admin/years/${editingYear.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: Number(yearNum),
          title,
          slug,
          description,
          cover_image_url: coverUrl,
          is_published: isPublished,
        }),
      });
      toast.success('Festival Year Updated', `Saved changes for "${title}".`);
    } else {
      // Create
      await fetch('/api/admin/years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: Number(yearNum),
          title,
          slug,
          description,
          cover_image_url: coverUrl,
          is_published: isPublished,
        }),
      });
      toast.success('Festival Year Created', `Created festival era "${title}".`);
    }

    setIsModalOpen(false);
    loadYears();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/years/${id}`, { method: 'DELETE' });
    toast.success('Festival Year Removed', 'Deleted festival year entry.');
    setDeleteConfirmId(null);
    loadYears();
  };

  const togglePublish = async (y: FestivalYear) => {
    const nextState = !y.is_published;
    await fetch(`/api/admin/years/${y.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: nextState }),
    });
    toast.info('Publish State Updated', `"${y.title}" is now ${nextState ? 'Published' : 'Draft'}.`);
    loadYears();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 pb-20 md:pb-0">
      <AdminHeader />

      <div className="flex-1 flex flex-col md:flex-row">
        <AdminSidebar />

        {/* FULL SCREEN WIDTH MAIN CONTENT AREA WITH FIXED SIDEBAR OFFSET */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-10 w-full max-w-full md:ml-72 min-h-[calc(100vh-64px)]">
          <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-orange-200 gap-3">
            <h1 className="font-editorial text-lg sm:text-2xl text-slate-900 font-bold">
              Festival Years
            </h1>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center space-x-1.5 px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-xs transition-all active:scale-95 flex-shrink-0"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Add Year</span>
            </button>
          </div>

          {/* Full Width Grid - 2 Columns on Mobile */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {years.map((y) => (
              <div
                key={y.id}
                className="p-3 sm:p-5 rounded-2xl bg-white border-2 border-orange-200 flex flex-col justify-between hover:border-orange-500 transition-all shadow-xs hover:shadow-md"
              >
                <div>
                  <div className="relative w-full aspect-[16/10] sm:h-48 rounded-xl overflow-hidden mb-2.5 sm:mb-4 bg-slate-100 border border-orange-200">
                    <SafeMediaImage
                      src={y.cover_image_url}
                      alt={y.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2 sm:px-3.5 py-0.5 sm:py-1 rounded-full bg-white/90 backdrop-blur-md text-orange-600 font-editorial font-bold border border-orange-300 text-[10px] sm:text-sm shadow-xs">
                      {y.year}
                    </div>
                  </div>

                  <h3 className="font-editorial text-xs sm:text-lg text-slate-900 font-bold mb-1 truncate">{y.title}</h3>
                  <p className="text-[11px] sm:text-xs text-slate-600 line-clamp-2 mb-3 sm:mb-4 leading-relaxed font-sans">
                    {y.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-2.5 sm:pt-4 border-t border-orange-100 flex items-center justify-between gap-1">
                  <button
                    onClick={() => togglePublish(y)}
                    className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${
                      y.is_published ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'bg-amber-50 text-amber-700 border border-amber-300'
                    }`}
                  >
                    {y.is_published ? 'Published' : 'Draft'}
                  </button>

                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <button
                      onClick={() => openEditModal(y)}
                      className="p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                      title="Edit Year Details"
                    >
                      <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(y.id)}
                      className="p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Year"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Create/Edit Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
              <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl border-2 border-orange-500 bg-white shadow-2xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-orange-100">
                  <h3 className="font-editorial text-2xl text-slate-900 font-bold">
                    {editingYear ? 'Edit Festival Year' : 'Create Festival Year'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] text-orange-700 uppercase tracking-wider block mb-1 font-bold">
                        Year
                      </label>
                      <input
                        type="number"
                        required
                        value={yearNum}
                        onChange={(e) => {
                          setYearNum(Number(e.target.value));
                          if (!editingYear) {
                            setTitle(`Vinayaka Chavithi ${e.target.value}`);
                            setSlug(e.target.value);
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-orange-700 uppercase tracking-wider block mb-1 font-bold">
                        URL Slug
                      </label>
                      <input
                        type="text"
                        required
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-orange-700 uppercase tracking-wider block mb-1 font-bold">
                      Festival Title
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-orange-700 uppercase tracking-wider block mb-1.5 font-bold">
                      Festival Era Cover Photo (Upload / Change)
                    </label>

                    <div className="space-y-3">
                      {/* Live Cover Preview Box */}
                      <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-slate-100 border border-orange-200 group">
                        {coverUrl ? (
                          <SafeMediaImage src={coverUrl} alt="Cover Preview" fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                            <Camera className="w-8 h-8 mb-2 text-orange-400" />
                            <span className="text-xs font-semibold">No Cover Image Uploaded</span>
                          </div>
                        )}

                        {/* Interactive Upload Overlay */}
                        <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white space-y-1 z-10">
                          <Upload className="w-6 h-6 text-orange-400" />
                          <span className="text-xs font-bold uppercase tracking-wider">
                            {uploadingCover ? 'Uploading...' : 'Click to Change Cover Photo'}
                          </span>
                        </label>
                      </div>

                      {/* File Upload Button & Direct File Input */}
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          id="cover-file-input"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadingCover(true);
                            try {
                              const formData = new FormData();
                              formData.append('file', file);
                              formData.append('title', `Cover Image - ${title || yearNum}`);
                              const res = await fetch('/api/admin/memories/upload', {
                                method: 'POST',
                                body: formData,
                              });
                              const data = await res.json();
                              if (data.memory?.storage_path) {
                                setCoverUrl(data.memory.storage_path);
                                toast.success('Cover Photo Uploaded', 'Updated cover photo for this festival era.');
                              } else if (data.url) {
                                setCoverUrl(data.url);
                                toast.success('Cover Photo Uploaded', 'Updated cover photo for this festival era.');
                              }
                            } catch (err) {
                              toast.error('Upload Error', 'Could not upload cover image file.');
                            } finally {
                              setUploadingCover(false);
                            }
                          }}
                        />

                        <label
                          htmlFor="cover-file-input"
                          className="flex-1 py-2.5 px-4 rounded-xl bg-orange-50 border border-orange-200 hover:bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider text-center cursor-pointer transition-all flex items-center justify-center space-x-2 shadow-xs"
                        >
                          <Upload className="w-4 h-4 text-orange-500" />
                          <span>{uploadingCover ? 'Uploading Image...' : 'Choose Photo from Device'}</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-orange-700 uppercase tracking-wider block mb-1 font-bold">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 font-semibold focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="pub-check"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                    />
                    <label htmlFor="pub-check" className="text-xs text-slate-700 font-semibold cursor-pointer">
                      Publish immediately to village archive
                    </label>
                  </div>

                  <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2.5 rounded-full border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider shadow-md"
                    >
                      Save Festival Year
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Safeguard Modal */}
          {deleteConfirmId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
              <div className="w-full max-w-sm p-6 rounded-3xl border-2 border-rose-500 bg-white text-center space-y-4 shadow-2xl">
                <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
                <h3 className="font-editorial text-2xl text-slate-900 font-bold">Confirm Deletion</h3>
                <p className="text-xs text-slate-600">
                  Deleting a festival year will permanently remove all associated memories and media. This action cannot be undone.
                </p>
                <div className="flex items-center justify-center space-x-3 pt-2">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="px-4 py-2 rounded-full border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirmId)}
                    className="px-6 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider shadow-md"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <AdminMobileBottomBar onOpenUpload={() => setIsUploadDrawerOpen(true)} />

      <UnifiedUploadDrawer
        isOpen={isUploadDrawerOpen}
        onClose={() => setIsUploadDrawerOpen(false)}
        onSuccess={loadYears}
        defaultTarget="memories"
      />
    </div>
  );
}

