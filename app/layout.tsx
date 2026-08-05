import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import { hero, REPO_URL, SITE_URL } from '@/content/landing';
import ReadingProgress from './components/ReadingProgress';
import './globals.css';

// 코드/데이터 폰트: JetBrains Mono (지시서 §1). 본문은 시스템 산세리프.
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
    // 이미지는 app/opengraph-image.tsx 에서 자동 생성
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
  // 파비콘·apple 아이콘은 app/favicon.ico · app/icon.png · app/apple-icon.png 규약으로 자동
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
      <body>
        {children}
        <ReadingProgress />
      </body>
    </html>
  );
}
