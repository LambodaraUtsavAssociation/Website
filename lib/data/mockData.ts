import { Category, FestivalYear, Memory } from '@/types';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-aagaman',
    name: 'Aagaman',
    telugu_name: 'ఆగమనం',
    slug: 'aagaman',
    description:
      'Grand arrival and welcoming processional of Lord Vinayaka into Papi Reddy Palli mandap.',
    display_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cat-sthapana',
    name: 'Sthapana',
    telugu_name: 'స్థాపన',
    slug: 'sthapana',
    description: 'Sacred consecration, idol installation, and Prana Pratishtha rituals.',
    display_order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cat-pooja-aarthi',
    name: 'Pooja & Aarthi',
    telugu_name: 'పూజ మరియు హారతి',
    slug: 'pooja-aarthi',
    description:
      'Daily morning and evening Vedic rituals, brass lamp Aarti, and devotional stotram chanting.',
    display_order: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cat-decoration',
    name: 'Decoration',
    telugu_name: 'అలంకరణ',
    slug: 'decoration',
    description:
      'Traditional flower garlands, coconut leaf pandal arches, and divine mandap lighting decorations.',
    display_order: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cat-culturals',
    name: 'Culturals',
    telugu_name: 'సాంస్కృతిక కార్యక్రమాలు',
    slug: 'culturals',
    description:
      'Devotional music, traditional folk dances, drama performances, and cultural stage programs.',
    display_order: 5,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cat-games-competitions',
    name: 'Games & Competitions',
    telugu_name: 'ఆటలు మరియు పోటీలు',
    slug: 'games-competitions',
    description:
      "Village community sports, children's drawing competitions, and festive sports events.",
    display_order: 6,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cat-annaprasadam',
    name: 'Annaprasadam',
    telugu_name: 'అన్నప్రసాదం',
    slug: 'annaprasadam',
    description: 'Community feast distribution and sacred Mahaprasadam serving to all devotees.',
    display_order: 7,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cat-random-clicks',
    name: 'Random Clicks',
    telugu_name: 'ఇతర జ్ఞాపకాలు',
    slug: 'random-clicks',
    description:
      'Candid village moments, volunteer portraits, behind-the-scenes preparation, and festive smiles.',
    display_order: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: 'cat-visarjan',
    name: 'Visarjan',
    telugu_name: 'నిమజ్జనం',
    slug: 'visarjan',
    description:
      'Immersion procession, grand Nimajjanam rallies, gulal celebrations, and farewell rituals.',
    display_order: 9,
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_YEARS: FestivalYear[] = [];
export const INITIAL_MEMORIES: Memory[] = [];
