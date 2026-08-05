import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import { hero, REPO_URL, SITE_URL } from '@/content/landing';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

const title = `smocket · ${hero.h1}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: title,
    template: '%s · smocket',
  },
  description: hero.sub,
  applicationName: 'smocket',
  keywords: [
    'socket.io',
    'socketio',
    'mock',
    'mocking',
    'testing',
    'websocket',
    'rooms',
    'broadcast',
    'namespace',
    'typescript',
    'smocket',
  ],
  authors: [{ name: 'Hyun', url: REPO_URL }],
  creator: 'Hyun',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'smocket',
    title,
    description: hero.sub,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description: hero.sub,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export const viewport: Viewport = {
  themeColor: '#f5ecdb',
  colorScheme: 'light',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <body>{children}</body>
    </html>
  );
}
