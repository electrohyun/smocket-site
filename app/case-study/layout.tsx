import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Application case study',
  description:
    'A pinned comparison of test-support approaches for one selected moderated chat-room workflow.',
  alternates: { canonical: '/case-study' },
  openGraph: {
    url: '/case-study',
    title: 'Application case study',
    description:
      'Real Socket.IO, published Smocket, and a handwritten mock in one selected workflow.',
  },
};

export default function CaseStudyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
