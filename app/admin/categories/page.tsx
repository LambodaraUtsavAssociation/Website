'use client';

import { useState, useEffect } from 'react';
import { Tag, Sparkles, BookOpen } from 'lucide-react';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import AdminMobileBottomBar from '@/components/AdminMobileBottomBar';
import UnifiedUploadDrawer from '@/components/UnifiedUploadDrawer';
import { Category } from '@/types';
import { getCategories } from '@/lib/data/repository';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isUploadDrawerOpen, setIsUploadDrawerOpen] = useState(false);

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

        {/* FULL SCREEN WIDTH MAIN CONTENT AREA WITH FIXED SIDEBAR OFFSET */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-10 w-full max-w-full md:ml-72 min-h-[calc(100vh-64px)]">
          <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-orange-200 gap-3">
            <h1 className="font-editorial text-lg sm:text-2xl text-slate-900 font-bold">
              Categories &amp; Chapters
            </h1>
            <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
              <Tag className="w-3 h-3 text-orange-600" />
              <span>{categories.length} Chapters</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {categories.map((cat, idx) => (
              <div
                key={cat.id}
                className="p-3 sm:p-5 rounded-2xl bg-white border-2 border-orange-200 hover:border-orange-500 transition-all flex flex-col justify-between shadow-xs hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5 pb-2.5 sm:mb-3 sm:pb-3 border-b border-orange-100">
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                      <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-orange-500 text-white font-editorial font-bold flex items-center justify-center text-[10px] sm:text-xs shadow-xs flex-shrink-0">
                        0{idx + 1}
                      </span>
                      <h4 className="text-xs sm:text-lg font-editorial text-slate-900 font-bold truncate">{cat.name}</h4>
                    </div>
                    <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 flex-shrink-0 hidden sm:block" />
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed font-sans mb-3 sm:mb-4 line-clamp-3">
                    {cat.description || 'No detailed description specified.'}
                  </p>
                </div>

                <div className="pt-2.5 sm:pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[9px] sm:text-[10px] text-orange-600 font-mono font-bold truncate">slug: {cat.slug}</span>
                  <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-[9px] sm:text-[10px] uppercase font-extrabold tracking-wider flex-shrink-0">
                    Chapter 0{idx + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      <AdminMobileBottomBar onOpenUpload={() => setIsUploadDrawerOpen(true)} />

      <UnifiedUploadDrawer
        isOpen={isUploadDrawerOpen}
        onClose={() => setIsUploadDrawerOpen(false)}
        onSuccess={loadCategories}
        defaultTarget="memories"
      />
    </div>
  );
}

