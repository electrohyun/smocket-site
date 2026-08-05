import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import { hero } from '@/content/landing';
import './globals.css';

// 코드/데이터 폰트: JetBrains Mono (지시서 §1). 본문은 시스템 산세리프.
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: `smocket — ${hero.h1}`,
  description: hero.sub,
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
