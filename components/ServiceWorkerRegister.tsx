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
            // Immediately check for updates on launch
            registration.update().catch(() => {});

            // Check for production updates whenever user re-opens or switches back to the app
            document.addEventListener('visibilitychange', () => {
              if (document.visibilityState === 'visible') {
                registration.update().catch(() => {});
              }
            });

            // Listen for new worker installation
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.info('Lambodara Utsav: New version installed in background.');
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
