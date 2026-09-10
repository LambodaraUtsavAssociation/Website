'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // Only register service worker in browser environments supporting it
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // In local development, unregister any active service worker so local dev CSS/HMR never gets cached or broken
      if (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.pathname.startsWith('/admin')
      ) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) {
            reg.unregister();
          }
        });
        if ('caches' in window) {
          caches.keys().then((names) => {
            for (const name of names) {
              caches.delete(name);
            }
          });
        }
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
                  if (
                    installingWorker.state === 'installed' &&
                    navigator.serviceWorker.controller
                  ) {
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
