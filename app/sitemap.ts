import type { MetadataRoute } from 'next';
import { demo, SITE_URL } from '@/content/landing';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}${demo.href}`, changeFrequency: 'monthly', priority: 0.8 },
  ];
}
