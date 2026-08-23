import type { Metadata } from 'next';

const title = 'Smocket interactive report';
const description =
  'How SharedWorker Smocket supports multi-user frontend previews before a backend is ready, where Real Socket.IO still fits, and what the three-tab drawing game verified.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/case-study' },
  openGraph: { type: 'article', url: '/case-study', title, description },
  twitter: { card: 'summary_large_image', title, description },
};

export default function CaseStudyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
