import type { MetadataRoute } from 'next';
import { hero } from '@/content/landing';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'smocket',
    short_name: 'smocket',
    description: hero.sub,
    start_url: '/',
    display: 'standalone',
    background_color: '#f5ecdb',
    theme_color: '#f5ecdb',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
