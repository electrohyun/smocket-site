import type { Metadata } from 'next';

const title = 'Smocket application case study';
const description =
  'How one Socket.IO drawing-game application runs with Real Socket.IO for the network path and Smocket for focused frontend development and application tests.';

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
