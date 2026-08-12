import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import sitemap from '../../sitemap';
import { footer, SITE_URL } from '../../../content/landing';
import { metadata } from '../layout';
import RoadmapPage from '../page';

const markup = renderToStaticMarkup(<RoadmapPage />);

describe('/roadmap', () => {
  it('opens as a compact project-direction report', () => {
    expect(markup).toContain('Roadmap to v1.0.0');
    expect(markup).toContain('Public project direction');
    expect(markup).toContain('The GitHub roadmap owns policy and current status.');
    expect(markup).toContain('Open the canonical roadmap');
    expect(markup).toContain('<nav');
  });

  it('states the intended guarantee and explicit non-goals', () => {
    expect(markup).toContain('What v1.0.0 aims to stabilize');
    expect(markup).toContain('stable observable behavior and public types');
    expect(markup).toContain('What v1.0.0 does not promise');
    expect(markup).toContain('Transport and fallback');
    expect(markup).toContain('Real-network reconnection');
    expect(markup).toContain('Binary encoding');
  });

  it('shows the review classification as optional disclosures', () => {
    expect(markup).toContain('Fidelity and Extensibility review');
    expect(markup).toContain('<details');
    expect(markup).toContain('<summary');
    expect(markup).toContain('Required for v1');
    expect(markup).toContain('Optional');
    expect(markup).toContain('Post-v1');
    expect(markup).toContain('Outside scope');
  });

  it('renders the conditional pre-v1 sequence as a labeled figure', () => {
    expect(markup).toContain('<figure');
    expect(markup).toContain('<figcaption');
    expect(markup).toContain('Published baseline');
    expect(markup).toContain('Classify findings');
    expect(markup).toContain('v0.4.3');
    expect(markup).toContain('Conditional v0.5.0');
    expect(markup).toContain('Only if required');
    expect(markup).toContain('Stabilization');
    expect(markup).toContain('v1.0.0');
  });

  it('maps release-order dependencies and the roadmap change process', () => {
    expect(markup).toContain('Release-order dependencies');
    expect(markup).toContain('Application validation');
    expect(markup).toContain('Package boundaries');
    expect(markup).toContain('Payload and lifecycle boundaries');
    expect(markup).toContain('Adapter boundary is not a release dependency');
    expect(markup).toContain('How this roadmap changes');
    expect(markup).toContain('<ol');
  });

  it('does not present transient issue counts or completion metrics', () => {
    expect(markup).not.toMatch(/% complete|open issues|closed issues|due date/i);
  });

  it('publishes route metadata', () => {
    expect(metadata.title).toBe('Roadmap to v1.0.0');
    expect(metadata.description).toContain('conditional release path');
    expect(metadata.alternates).toEqual({ canonical: '/roadmap' });
  });

  it('is discoverable from the shared footer and sitemap', () => {
    expect(footer.links).toContainEqual({
      label: 'Roadmap',
      href: '/roadmap',
      todo: null,
    });
    expect(sitemap()).toContainEqual({
      url: `${SITE_URL}/roadmap`,
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  });
});
