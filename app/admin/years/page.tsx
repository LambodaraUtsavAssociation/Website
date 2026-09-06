'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import { FestivalYear } from '@/types';
import { getFestivalYears } from '@/lib/data/repository';

export default function AdminYearsPage() {
  const [years, setYears] = useState<FestivalYear[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<FestivalYear | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
    setCoverUrl('https://images.unsplash.com/photo-1567157577867-05ccb1388e66?q=80&w=2000&auto=format&fit=crop');
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
    }

    setIsModalOpen(false);
    loadYears();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/years/${id}`, { method: 'DELETE' });
    setDeleteConfirmId(null);
    loadYears();
  };

  const togglePublish = async (y: FestivalYear) => {
    await fetch(`/api/admin/years/${y.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !y.is_published }),
    });
    loadYears();
  };

  return (
    <div className="min-h-screen bg-charcoal-950 flex flex-col">
      <AdminHeader />

      <div className="flex-1 flex flex-col md:flex-row">
        <AdminSidebar />

        {/* FULL SCREEN WIDTH MAIN CONTENT AREA */}
        <main className="flex-1 p-6 sm:p-10 w-full max-w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-6 border-b border-charcoal-800 gap-4">
            <div>
              <h1 className="font-editorial text-3xl sm:text-5xl text-ivory-50 font-normal">
                Festival Years &amp; Eras
              </h1>
              <p className="text-xs sm:text-sm text-ivory-300/80 mt-1 font-sans">
                Create new celebration years, configure cover imagery, and publish when ready across full screen width.
              </p>
            </div>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-gradient-to-r from-saffron-700 via-saffron-600 to-saffron-700 border-b-2 border-gold-400 text-ivory-50 text-xs font-semibold uppercase tracking-[0.15em] shadow-glow-saffron transition-all transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Festival Year</span>
            </button>
          </div>

          {/* Full Width Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {years.map((y) => (
              <div
                key={y.id}
                className="p-5 rounded-3xl bg-charcoal-900/80 border border-charcoal-800 flex flex-col justify-between hover:border-gold-500/40 transition-all shadow-xl"
              >
                <div>
                  <div className="relative w-full h-48 rounded-2xl overflow-hidden mb-4 bg-charcoal-950 border border-charcoal-700">
                    <Image
                      src={y.cover_image_url || 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?q=80&w=1000&auto=format&fit=crop'}
                      alt={y.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-3 left-3 px-3.5 py-1 rounded-full bg-charcoal-950/90 backdrop-blur-md text-gold-300 font-editorial font-semibold border border-gold-500/40 text-sm">
                      {y.year}
                    </div>
                  </div>

                  <h3 className="font-editorial text-2xl text-ivory-50 mb-1">{y.title}</h3>
                  <p className="text-xs text-ivory-300/80 line-clamp-2 mb-4 leading-relaxed font-sans">
                    {y.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-charcoal-800 flex items-center justify-between">
                  <button
                    onClick={() => togglePublish(y)}
                    className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${y.is_published ? 'bg-green-900/60 text-green-300 border border-green-700/50' : 'bg-yellow-900/60 text-yellow-300 border border-yellow-700/50'
                      }`}
                  >
                    {y.is_published ? 'Published' : 'Unpublished'}
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(y)}
                      className="p-2 rounded-xl bg-charcoal-800 text-ivory-300 hover:text-gold-400 border border-charcoal-700"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(y.id)}
                      className="p-2 rounded-xl bg-maroon-900/60 text-red-300 hover:text-red-200 border border-maroon-700/50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Create/Edit Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl border border-gold-500/40 bg-charcoal-900 shadow-2xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-charcoal-800">
                  <h3 className="font-editorial text-2xl text-ivory-50">
                    {editingYear ? 'Edit Festival Year' : 'Create Festival Year'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-ivory-400 hover:text-ivory-100">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] text-gold-400 uppercase tracking-wider block mb-1 font-semibold">
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
                        className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-xs text-ivory-50 focus:outline-none focus:border-gold-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gold-400 uppercase tracking-wider block mb-1 font-semibold">
                        URL Slug
                      </label>
                      <input
                        type="text"
                        required
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-xs text-ivory-50 focus:outline-none focus:border-gold-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-gold-400 uppercase tracking-wider block mb-1 font-semibold">
                      Festival Title
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-xs text-ivory-50 focus:outline-none focus:border-gold-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-gold-400 uppercase tracking-wider block mb-1 font-semibold">
                      Cover Image URL
                    </label>
                    <input
                      type="url"
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-xs text-ivory-50 focus:outline-none focus:border-gold-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-gold-400 uppercase tracking-wider block mb-1 font-semibold">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-xs text-ivory-50 focus:outline-none focus:border-gold-400"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="pub-check"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="rounded border-charcoal-700 text-saffron-600 focus:ring-0"
                    />
                    <label htmlFor="pub-check" className="text-xs text-ivory-200 cursor-pointer">
                      Publish immediately to village archive
                    </label>
                  </div>

                  <div className="pt-4 flex items-center justify-end space-x-3 border-t border-charcoal-800">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2.5 rounded-full border border-charcoal-700 text-xs text-ivory-300 hover:text-ivory-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-full bg-saffron-600 hover:bg-saffron-500 text-ivory-50 text-xs font-medium uppercase tracking-wider"
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
              <div className="w-full max-w-sm p-6 rounded-3xl border border-red-500/40 bg-charcoal-900 text-center space-y-4 shadow-2xl">
                <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
                <h3 className="font-editorial text-2xl text-ivory-50">Confirm Deletion</h3>
                <p className="text-xs text-ivory-300">
                  Deleting a festival year will permanently remove all associated memories and media. This action cannot be undone.
                </p>
                <div className="flex items-center justify-center space-x-3 pt-2">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="px-4 py-2 rounded-full border border-charcoal-700 text-xs text-ivory-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirmId)}
                    className="px-6 py-2 rounded-full bg-red-600 text-ivory-50 text-xs font-medium"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
