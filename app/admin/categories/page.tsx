'use client';

import { useState, useEffect } from 'react';
import { Tag, BookOpen } from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import AdminMobileBottomBar from '@/components/AdminMobileBottomBar';
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 pb-20 md:pb-0">
      <AdminHeader />

      <div className="flex-1 flex flex-col md:flex-row">
        <AdminSidebar />

        <main className="flex-1 p-3.5 sm:p-6 lg:p-10 pb-24 md:pb-8 w-full max-w-full md:ml-72 min-h-[calc(100vh-64px)]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-orange-200 gap-3">
            <div>
              <h1 className="font-editorial text-2xl sm:text-3xl text-slate-900 font-bold">
                Categories &amp; Chapters
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Official celebration chapters organizing photos and videos across the timeline.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0">
              <Tag className="w-3.5 h-3.5 text-orange-600" />
              <span>{categories.length} Chapters</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {categories.map((cat, idx) => (
              <div
                key={cat.id}
                className="p-5 rounded-3xl bg-white border border-slate-200/90 hover:border-orange-400 transition-all flex flex-col justify-between shadow-2xs hover:shadow-md group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-orange-100">
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="w-8 h-8 rounded-xl bg-orange-500 text-white font-editorial font-bold flex items-center justify-center text-xs shadow-xs flex-shrink-0">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <h4 className="text-base font-editorial text-slate-900 font-bold truncate">
                        {cat.name}
                      </h4>
                    </div>
                    <BookOpen className="w-4 h-4 text-orange-400 group-hover:text-orange-600 transition-colors flex-shrink-0" />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans mb-4 line-clamp-3">
                    {cat.description || 'Official festival celebration chapter category.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-orange-700 font-mono font-bold truncate">
                    slug: {cat.slug}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200 text-[10px] uppercase font-extrabold tracking-wider flex-shrink-0">
                    Chapter {idx + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      <AdminMobileBottomBar />
    </div>
  );
}
