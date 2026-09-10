import Link from 'next/link';

export default function AboutPage() {
  const associationName = process.env.NEXT_PUBLIC_ASSOCIATION_NAME || 'Lambodara Utsav Association';
  const villageName = process.env.NEXT_PUBLIC_VILLAGE_NAME || 'Papi Reddy Palli';

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Page Title Header with Temple Gateway Motif */}
      <div className="text-center mb-16">
        <div className="relative inline-block py-2 px-8 border-y-2 border-gold-500/40 bg-charcoal-950/60 backdrop-blur-md mb-6">
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-gold-400 rotate-45 border border-charcoal-950" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold-300">
            {associationName} ({villageName})
          </span>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-gold-400 rotate-45 border border-charcoal-950" />
        </div>

        <h1 className="font-editorial text-4xl sm:text-6xl text-ivory-50 font-normal mb-4">
          About Our Sacred Gallery
        </h1>
        <p className="font-editorial text-xl sm:text-2xl text-gold-300 italic max-w-2xl mx-auto leading-relaxed">
          &ldquo;శ్రీ విఘ్నేశ్వర ప్రసాదేన సర్వకార్యాణి సిద్ధ్యన్తు |&rdquo;
          <br />
          <span className="text-sm font-sans uppercase tracking-widest text-ivory-200/90 not-italic block mt-1">
            &ldquo;Pure devotion. Timeless memories. One association. One celebration.&rdquo;
          </span>
        </p>
      </div>

      {/* Main Narrative Blocks — Stepped Temple Sanctuary Pillars */}
      <div className="space-y-10">
        <div className="p-8 sm:p-10 border-l-2 border-gold-500/60 bg-charcoal-900/60 text-left space-y-4">
          <h2 className="font-editorial text-2xl sm:text-3xl text-gold-400 font-normal">
            The Devotional Heart of {associationName}
          </h2>
          <p className="text-sm sm:text-base text-ivory-200/90 leading-relaxed font-sans">
            For generations in {villageName}, {associationName}&rsquo;s Vinayaka Chavithi
            celebration has been the sacred anchor of our community. As the auspicious morning
            heralds Lord Ganesha&rsquo;s sthapana, the air fills with Vedic chants, fresh marigolds,
            banana leaves, and the sweet aroma of homemade modakams. Differences dissolve as elders,
            mothers, youth, and children assemble under the mandap in pure faith and harmony.
          </p>
        </div>

        <div className="p-8 sm:p-10 border-l-2 border-gold-500/60 bg-charcoal-900/60 text-left space-y-4">
          <h2 className="font-editorial text-2xl sm:text-3xl text-gold-400 font-normal">
            A Living Sanctuary for Global Village Family
          </h2>
          <p className="text-sm sm:text-base text-ivory-200/90 leading-relaxed font-sans">
            Established in 2026 by {associationName}, this digital memory gallery was built so that
            no sacred prayer, evening aarti, or joyful Kolatam dance is ever forgotten. Whether
            living in {villageName} or halfway across the world, every villager can step into this
            sanctuary to relive the sights, sounds, and divine spirit of our annual Vinayaka
            Chavithi celebrations.
          </p>
        </div>

        <div className="p-8 sm:p-10 border-l-2 border-gold-500/60 bg-charcoal-900/60 text-left space-y-4">
          <h2 className="font-editorial text-2xl sm:text-3xl text-gold-400 font-normal">
            Sacred Preservation & Integrity
          </h2>
          <p className="text-sm sm:text-base text-ivory-200/90 leading-relaxed font-sans">
            To preserve the reverent atmosphere and visual excellence of our archive, content is
            managed exclusively by our authorized {associationName} administrator. High-definition
            photographs and video documentaries captured live each day are permanently archived in
            full visual clarity.
          </p>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="mt-16 text-center pt-8 border-t border-charcoal-800">
        <Link
          href="/2026"
          className="inline-block px-8 py-3.5 text-xs font-semibold tracking-[0.2em] uppercase text-ivory-50 bg-gradient-to-r from-saffron-700 via-saffron-600 to-saffron-700 border-b-2 border-gold-400 shadow-glow-saffron transition-all transform hover:-translate-y-0.5"
        >
          Experience Vinayaka Chavithi 2026 Gallery &rarr;
        </Link>
      </div>
    </div>
  );
}
