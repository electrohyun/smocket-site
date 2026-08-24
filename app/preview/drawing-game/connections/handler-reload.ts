'use client';

import { useEffect } from 'react';
import { PREVIEW_WORKER_VERSION_KEY } from './page-connection';

const CHECK_MS = 1000;

/** Recording-only dev aid: changed worker code gets a fresh worker name in every open tab. */
export function useHandlerReload(): void {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    let live = true;

    const check = async () => {
      try {
        const response = await fetch('/preview/drawing-game/handler-version', { cache: 'no-store' });
        if (!response.ok || !live) return;
        const { version } = await response.json() as { version: string };
        const current = localStorage.getItem(PREVIEW_WORKER_VERSION_KEY);
        if (!current) {
          localStorage.setItem(PREVIEW_WORKER_VERSION_KEY, version);
          window.location.reload();
        } else if (current !== version) {
          localStorage.setItem(PREVIEW_WORKER_VERSION_KEY, version);
          window.location.reload();
        }
      } catch {
        // The preview remains usable if the optional development watcher is unavailable.
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === PREVIEW_WORKER_VERSION_KEY && event.newValue) window.location.reload();
    };
    window.addEventListener('storage', onStorage);
    void check();
    const timer = window.setInterval(() => void check(), CHECK_MS);
    return () => {
      live = false;
      window.clearInterval(timer);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
}
