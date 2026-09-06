import { FestivalYear } from '@/types';

interface FestivalIntroSectionProps {
  activeYear?: FestivalYear | null;
  associationName?: string;
  villageName?: string;
}

export default function FestivalIntroSection({
  activeYear,
  associationName = process.env.NEXT_PUBLIC_ASSOCIATION_NAME || 'Lambodara Utsav Association',
  villageName = process.env.NEXT_PUBLIC_VILLAGE_NAME || 'Papi Reddy Palli',
}: FestivalIntroSectionProps) {
  const displayTitle = activeYear?.title || 'Vinayaka Chavithi 2026 Celebration';

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center relative overflow-hidden">
      {/* Decorative Warm Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-saffron-600/5 blur-3xl rounded-full pointer-events-none" />

      {/* Sacred Header */}
      <div className="relative z-10">
        <div className="inline-block py-1.5 px-6 border-y border-gold-500/40 bg-saffron-600/10 text-gold-300 text-xs sm:text-sm font-semibold tracking-[0.2em] mb-6">
          మన ఊరు &bull; మన సంస్కృతి &bull; మన జ్ఞాపకాలు
        </div>

        {/* Sacred Sanskrit Shloka Box */}
        <div className="max-w-2xl mx-auto mb-10 p-6 border-x-2 border-gold-500/50 bg-charcoal-900/60 backdrop-blur-sm shadow-xl">
          <p className="font-editorial text-lg sm:text-xl text-gold-300 leading-relaxed tracking-wide italic mb-2">
            &ldquo;వక్రతుండ మహాకాయ సూర్యకోటి సమప్రభ |<br />
            నిర్విఘ్నం కురు మే దేవ సర్వకార్యేషు సర్వదా ॥&rdquo;
          </p>
          <p className="text-[11px] text-ivory-300 uppercase tracking-widest font-sans">
            &mdash; O Lord Ganesha, of curved trunk and immense form, radiant as a million suns, remove all obstacles from our paths forever.
          </p>
        </div>

        <h2 className="text-xs sm:text-sm uppercase tracking-[0.3em] text-gold-400 mb-3">
          <span className="font-extrabold">{associationName}</span> &bull; <span className="font-medium">{villageName}</span>
        </h2>

        <h3 className="text-3xl sm:text-5xl text-ivory-50 tracking-wide mb-8">
          <span className="font-normal">Vinayaka Chavithi </span>
          <span className="font-bold font-year text-gradient-gold">2026</span>
          <span className="font-normal"> Celebration</span>
        </h3>

        {/* Deep Devotional Narrative */}
        <div className="space-y-6 text-ivory-200/90 text-sm sm:text-base leading-relaxed font-sans max-w-3xl mx-auto">
          <p className="font-editorial italic text-xl sm:text-2xl text-ivory-100 leading-relaxed">
            &ldquo;In our beloved village of {villageName}, {associationName}&rsquo;s Vinayaka Chavithi is not merely a festival - it is the living heart of our faith, where sacred chants echo through the mandap, marigold garlands adorn the Lord of Obstacles, and every family comes together as one.&rdquo;
          </p>

          <p>
            From the auspicious morning <strong className="text-gold-300">Prana Pratishtha</strong> and sacred <strong className="text-gold-300">Ashtottara Shatanamavali</strong> recitations to the fragrant <strong className="text-gold-300">Modaka Nivedana</strong> and brass deepam evening <strong className="text-gold-300">Aartis</strong>, this sanctuary preserves the divine atmosphere, sacred rituals, and precious memories of our village for generations to come.
          </p>
        </div>

        {/* 4 Pillars of Devotion */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-10 border-t border-charcoal-800 text-left">
          <div className="p-4 border-l-2 border-gold-500/60 bg-charcoal-900/60">
            <span className="block font-editorial text-lg text-gold-400 font-semibold mb-1">పవిత్ర పూజ</span>
            <span className="block text-xs uppercase tracking-wider text-ivory-200 font-semibold mb-1">Sacred Pooja</span>
            <span className="text-[11px] text-ivory-400 leading-snug block">Vedic chants & morning floral offerings.</span>
          </div>

          <div className="p-4 border-l-2 border-gold-500/60 bg-charcoal-900/60">
            <span className="block font-editorial text-lg text-gold-400 font-semibold mb-1">మహా ప్రసాదం</span>
            <span className="block text-xs uppercase tracking-wider text-ivory-200 font-semibold mb-1">Maha Prasadam</span>
            <span className="text-[11px] text-ivory-400 leading-snug block">Blessed modak & community meal offerings.</span>
          </div>

          <div className="p-4 border-l-2 border-gold-500/60 bg-charcoal-900/60">
            <span className="block font-editorial text-lg text-gold-400 font-semibold mb-1">భక్తి సంస్కృతి</span>
            <span className="block text-xs uppercase tracking-wider text-ivory-200 font-semibold mb-1">Devotional Arts</span>
            <span className="text-[11px] text-ivory-400 leading-snug block">Evening bhajans & village cultural programs.</span>
          </div>

          <div className="p-4 border-l-2 border-gold-400 bg-charcoal-900/60">
            <span className="block font-editorial text-lg text-gold-400 font-semibold mb-1">శోభా యాత్ర</span>
            <span className="block text-xs uppercase tracking-wider text-ivory-200 font-semibold mb-1">Grand Immersion</span>
            <span className="text-[11px] text-ivory-400 leading-snug block">Solemn Lake Nimajjanam farewell procession.</span>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center space-x-2 text-xs uppercase tracking-[0.2em] text-gold-400 font-semibold">
          <span>&bull; Preserving {associationName} ({villageName}) Sacred Heritage &bull;</span>
        </div>
      </div>
    </section>
  );
}
