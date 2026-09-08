'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // Only register service worker in browser environments supporting it
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Don't register on admin routes to prevent any caching of administrative views
      if (window.location.pathname.startsWith('/admin')) {
        return;
      }

      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            // Check for updates periodically
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New content available
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.debug('ServiceWorker registration skipped:', err);
          });
      });
    }
  }, []);

  return null;
}
