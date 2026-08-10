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
  // The browser's own chrome — address bar, form controls — follows the theme
  // too. Only the system preference can be expressed here; a reader who has
  // overridden it with the switch gets the right page either way, and this is
  // the frame around it.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5ecdb' },
    { media: '(prefers-color-scheme: dark)', color: '#232043' },
  ],
  colorScheme: 'light dark',
};

/* Runs before the first paint, so a reader who chose a side never sees the
   system's theme first and the chosen one a frame later. It is inline and
   blocking for that reason — anything deferred is already too late. Absent or
   unreadable storage leaves the attribute off, which is the device setting, and
   the stylesheet's media query takes it from there. Keep the key in step with
   THEME_KEY in ThemeToggle.tsx. Since this intentionally changes `<html>` before
   React hydrates it, that one element suppresses the expected attribute warning. */
const applyStoredTheme = `try{var t=localStorage.getItem('smocket-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={jetbrainsMono.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: applyStoredTheme }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
