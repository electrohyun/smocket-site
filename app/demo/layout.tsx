import type { Metadata, Viewport } from 'next';
import { demo } from '@/content/landing';
import './demo.css';

export const metadata: Metadata = {
  title: demo.title,
  description: demo.desc,
  alternates: { canonical: demo.href },
  openGraph: { url: demo.href, title: demo.title, description: demo.desc },
};

/* The root layout declares the landing's cream; this route is dark, and the
   browser chrome has to be told separately from the stylesheet. */
export const viewport: Viewport = {
  themeColor: '#0b0d16',
  colorScheme: 'dark',
};

export default function DemoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
