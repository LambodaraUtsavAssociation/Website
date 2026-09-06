import type { Metadata } from 'next';
import { Cinzel, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-cinzel',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

const associationName = process.env.NEXT_PUBLIC_ASSOCIATION_NAME || 'Lambodara Utsav Association';
const villageName = process.env.NEXT_PUBLIC_VILLAGE_NAME || 'Papi Reddy Palli';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: `${associationName} (${villageName}) - Vinayaka Chavithi Digital Gallery`,
  description: `A permanent, cinematic digital gallery preserving the faith, tradition, celebration, and memories of ${associationName}, ${villageName}.`,
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/images/village_logo_icon.svg', type: 'image/svg+xml' },
      { url: '/images/village_logo_icon.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: `${associationName} (${villageName}) - Vinayaka Chavithi Digital Gallery`,
    description: `Pure devotion. Timeless memories. One association. One celebration.`,
    type: 'website',
    images: ['/images/village_logo_icon.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${plusJakartaSans.variable} ${cinzel.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body
        className="bg-charcoal-950 text-ivory-50 min-h-screen flex flex-col selection:bg-saffron-600 selection:text-white font-sans"
        suppressHydrationWarning
      >
        <Header associationName={associationName} villageName={villageName} />
        <main className="flex-1">{children}</main>
        <Footer associationName={associationName} villageName={villageName} />
      </body>
    </html>
  );
}
