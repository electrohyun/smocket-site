import type { Metadata } from 'next';

const title = 'Smocket application case study';
const description =
  'How one drawing-game application runs with a Node.js mock server built with Socket.IO or with Smocket, and where the production backend still fits.';

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
