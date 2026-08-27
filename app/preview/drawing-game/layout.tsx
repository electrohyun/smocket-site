import type { Metadata, Viewport } from 'next';
import '../../demo/demo.css';

export const metadata: Metadata = {
  title: { absolute: 'Drawing Game Preview · smocket' },
  description: 'Three browser tabs sharing one in-browser Smocket server for frontend development.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#0b0d16',
  colorScheme: 'dark',
};

export default function DrawingGamePreviewLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
