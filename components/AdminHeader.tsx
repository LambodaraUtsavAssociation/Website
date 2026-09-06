'use client';

import Image from 'next/image';

interface AdminHeaderProps {
  associationName?: string;
  villageName?: string;
}

export default function AdminHeader({
  associationName = process.env.NEXT_PUBLIC_ASSOCIATION_NAME || 'Lambodara Utsav Association',
  villageName = process.env.NEXT_PUBLIC_VILLAGE_NAME || 'Papi Reddy Palli',
}: AdminHeaderProps) {
  return (
    <header className="bg-charcoal-900 border-b border-gold-500/30 sticky top-0 z-40 px-4 sm:px-8 py-3.5 shadow-2xl">
      <div className="w-full max-w-full px-2 sm:px-6 flex items-center justify-between">
        {/* Left Branding with Emblem */}
        <div className="flex items-center space-x-3">
          <div
            className="relative flex-shrink-0 bg-transparent drop-shadow-md"
            style={{ width: '42px', height: '42px', minWidth: '42px', minHeight: '42px' }}
          >
            <picture>
              <source media="(max-width: 767px)" type="image/svg+xml" srcSet="/images/village_logo_icon.svg" />
              <img
                src="/images/village_logo_icon.png"
                alt={`${associationName} (${villageName}) Emblem`}
                width={256}
                height={256}
                className="object-contain w-[42px] h-[42px]"
              />
            </picture>
          </div>
          <div>
            <span className="font-editorial text-lg sm:text-xl font-semibold text-ivory-50 block leading-tight">
              {associationName} &bull; Admin Sanctuary
            </span>
            <span className="text-[10px] uppercase tracking-widest text-gold-400 font-sans font-semibold">
              {villageName} Content Management Portal
            </span>
          </div>
        </div>

        {/* Header Right Status Badge */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-saffron-600/10 border border-gold-500/30 text-gold-300 text-[10px] uppercase tracking-widest font-semibold">
          <span>Master Admin Portal Active</span>
        </div>
      </div>
    </header>
  );
}
