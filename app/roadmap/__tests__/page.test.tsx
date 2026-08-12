import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import sitemap from '../../sitemap';
import { footer, SITE_URL } from '../../../content/landing';
import { metadata } from '../layout';
import RoadmapPage from '../page';

const markup = renderToStaticMarkup(<RoadmapPage />);
const stylesheet = readFileSync(new URL('../page.module.css', import.meta.url), 'utf8');
const journeyStyles = stylesheet.slice(stylesheet.indexOf('/* Vertical journey revision'));
const desktopJourneyStyles = journeyStyles.slice(0, journeyStyles.indexOf('@media'));
const mobileJourneyStyles = journeyStyles.slice(journeyStyles.indexOf('@media (max-width: 720px)'));

describe('/roadmap', () => {
  it('opens as a reading-first project-direction report', () => {
    expect(markup).toContain('Roadmap to v1.0.0');
    expect(markup).toContain('Public project direction');
    expect(markup).toContain('The GitHub roadmap owns policy and current status.');
    expect(markup).toContain('Open the canonical roadmap');
    expect(markup).toContain('<nav');
  });

  it('connects every subject as one vertical journey', () => {
    expect(markup).toContain('Journey through v1.0.0');
    expect(markup.match(/data-journey-stop=/g)).toHaveLength(5);
    expect(markup.match(/data-route-stage=/g)).toHaveLength(7);
    expect(markup).toContain('Reading position');
    expect(markup).toContain('Next:');
    expect(markup).toContain('Conditional branch');
    expect(markup).toContain('Rejoins at stabilization');
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

  it('removes journey motion when the reader requests reduced motion', () => {
    expect(stylesheet).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(stylesheet).toMatch(/[.]journeyNavTrack span,[\s\S]*transition: none !important/);
  });

  it('keeps the desktop journey navigator out of the reading column', () => {
    expect(desktopJourneyStyles).toMatch(/[.]journeyLayout\s*{[^}]*display: block/);
    expect(desktopJourneyStyles).toMatch(/[.]journeyNav\s*{[^}]*display: grid/);
    expect(desktopJourneyStyles).toMatch(/[.]journeyNav\s*{[^}]*grid-template-columns:/);
    expect(desktopJourneyStyles).toMatch(/[.]journeyNav\s*{[^}]*position: sticky/);
  });

  it('uses a compact section rhythm with headings on the content baseline', () => {
    expect(desktopJourneyStyles).toMatch(/[.]section\s*{[^}]*min-height: 0/);
    expect(desktopJourneyStyles).toMatch(/[.]sectionHeading\s*{[^}]*display: block/);
    expect(desktopJourneyStyles).toMatch(
      /[.]disclosureGrid\s*{[^}]*grid-template-columns: 1fr 1fr/,
    );
  });

  it('lifts interactive panels without requiring motion', () => {
    expect(journeyStyles).toMatch(/stageCard:hover[\s\S]*transform: translateY\(-4px\)/);
    expect(journeyStyles).toMatch(/focus-visible[\s\S]*outline:/);
    expect(journeyStyles).toMatch(
      /prefers-reduced-motion: reduce[\s\S]*transform: none !important/,
    );
  });

  it('starts the mobile journey tabs at the first stop', () => {
    expect(mobileJourneyStyles).toMatch(
      /[.]journeyNav ol\s*{[^}]*justify-content: flex-start/,
    );
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
