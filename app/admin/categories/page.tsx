'use client';

import { useState, useEffect } from 'react';
import { Tag } from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import { Category } from '@/types';
import { getCategories } from '@/lib/data/repository';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const data = await getCategories();
    setCategories(data);
  }

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
                Celebration Categories &amp; Chapters
              </h1>
              <p className="text-xs sm:text-sm text-ivory-300/80 mt-1 font-sans">
                Sacred ritual chapters used to organize media records across festival years.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, idx) => (
              <div
                key={cat.id}
                className="p-6 rounded-3xl bg-charcoal-900/80 border border-charcoal-800 hover:border-gold-500/40 transition-all flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="w-9 h-9 rounded-full bg-gold-500/15 border border-gold-500/40 text-gold-400 font-editorial font-semibold flex items-center justify-center text-sm">
                      0{idx + 1}
                    </span>
                    <h4 className="text-xl font-editorial text-ivory-50 font-normal">{cat.name}</h4>
                  </div>
                  <p className="text-xs text-ivory-300/80 leading-relaxed font-sans mb-4">
                    {cat.description || 'No detailed description specified.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-charcoal-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-gold-400/80 font-mono">slug: {cat.slug}</span>
                  <span className="px-3 py-1 rounded-full bg-charcoal-950 text-ivory-400 text-[10px] uppercase font-semibold">
                    Chapter 0{idx + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
