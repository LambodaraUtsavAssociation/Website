import type { Metadata, Viewport } from 'next';
import { Cinzel, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ToastContainer from '@/components/ToastContainer';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import DevotionalFlowerShower from '@/components/DevotionalFlowerShower';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

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

export const viewport: Viewport = {
  themeColor: '#0a0a0d',
  width: 'device-width',
  initialScale: 1,
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://lambodarautsav.org');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: `${associationName} (${villageName}) - Vinayaka Chavithi Digital Gallery`,
  description: `A permanent, cinematic digital gallery preserving the faith, tradition, celebration, and memories of ${associationName}, ${villageName}.`,
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/images/village_logo.webp', type: 'image/webp' },
      { url: '/images/icon-192.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: `${associationName} (${villageName}) - Vinayaka Chavithi Digital Gallery`,
    description: `Pure devotion. Timeless memories. One association. One celebration.`,
    type: 'website',
    url: siteUrl,
    siteName: `${associationName} (${villageName})`,
    images: [
      {
        url: '/images/village_logo.png',
        width: 1200,
        height: 630,
        alt: `${associationName} - Vinayaka Chavithi Celebrations`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${associationName} (${villageName}) - Vinayaka Chavithi Digital Gallery`,
    description: `Pure devotion. Timeless memories. One association. One celebration.`,
    images: ['/images/village_logo.png'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Lambodara Utsav',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${plusJakartaSans.variable} ${cinzel.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0d" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link
          rel="preconnect"
          href="https://pub-13aeba224f4f47cba2eb4c85f116f469.r2.dev"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://pub-13aeba224f4f47cba2eb4c85f116f469.r2.dev" />
        <link rel="preconnect" href="https://img.youtube.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://img.youtube.com" />
        <link rel="preconnect" href="https://www.youtube-nocookie.com" />
        <link rel="dns-prefetch" href="https://www.youtube-nocookie.com" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  '@id': `${siteUrl}/#organization`,
                  name: associationName,
                  alternateName: `${associationName} ${villageName}`,
                  url: siteUrl,
                  logo: `${siteUrl}/images/village_logo.png`,
                  address: {
                    '@type': 'PostalAddress',
                    addressLocality: villageName,
                    addressRegion: 'Andhra Pradesh',
                    addressCountry: 'IN',
                  },
                },
                {
                  '@type': 'Event',
                  '@id': `${siteUrl}/#festival`,
                  name: `Vinayaka Chavithi Celebrations - ${associationName}`,
                  description: `Annual Vinayaka Chavithi celebrations, cultural rituals, and community festivities organized by ${associationName}, ${villageName}.`,
                  url: siteUrl,
                  organizer: {
                    '@id': `${siteUrl}/#organization`,
                  },
                  eventStatus: 'https://schema.org/EventScheduled',
                  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
                  location: {
                    '@type': 'Place',
                    name: `${villageName} Celebration Mandapam`,
                    address: {
                      '@type': 'PostalAddress',
                      addressLocality: villageName,
                      addressRegion: 'Andhra Pradesh',
                      addressCountry: 'IN',
                    },
                  },
                },
                {
                  '@type': 'ImageGallery',
                  '@id': `${siteUrl}/#gallery`,
                  name: `${associationName} Digital Festival Archive`,
                  description: `Sacred memories, video highlights, and darshan gallery of Vinayaka Chavithi celebrations in ${villageName}.`,
                  publisher: {
                    '@id': `${siteUrl}/#organization`,
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body
        className="bg-charcoal-950 text-ivory-50 min-h-screen flex flex-col selection:bg-saffron-600 selection:text-white font-sans"
        suppressHydrationWarning
      >
        <ServiceWorkerRegister />
        <Header associationName={associationName} villageName={villageName} />
        <main className="flex-1">{children}</main>
        <Footer associationName={associationName} villageName={villageName} />
        <ToastContainer />
        <DevotionalFlowerShower />
        <PWAInstallPrompt associationName={associationName} villageName={villageName} />
      </body>
    </html>
  );
}
