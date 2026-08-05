import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/content/landing';

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_URL, changeFrequency: 'monthly', priority: 1 }];
}
