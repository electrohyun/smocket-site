import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Roadmap to v1.0.0',
  description:
    'The guarantee, review gates, dependencies, and conditional release path toward smocket v1.0.0.',
  alternates: { canonical: '/roadmap' },
  openGraph: {
    url: '/roadmap',
    title: 'Roadmap to v1.0.0',
    description: 'A public overview of the decisions and release path toward smocket v1.0.0.',
  },
};

export default function RoadmapLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
