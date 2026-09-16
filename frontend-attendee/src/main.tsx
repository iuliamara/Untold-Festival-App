import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    // Register PWA Service Worker (production only — in dev it would cache-first serve stale
    // JS/CSS over Vite's HMR-served modules, silently hiding code changes behind a 30-day cache).
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('PWA Service Worker registered successfully:', registration.scope);
        })
        .catch((error) => {
          console.error('PWA Service Worker registration failed:', error);
        });
    });
  } else {
    // Self-heal dev environments where the service worker got registered before this guard
    // existed: an already-installed SW keeps intercepting requests regardless of this file's
    // current content, which is exactly what makes stale code require a hard refresh to see.
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
    if ('caches' in window) {
      caches.keys().then((names) => names.forEach((name) => caches.delete(name)));
    }
  }
}
