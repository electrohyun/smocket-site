import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import sitemap from '../../sitemap';
import { footer, SITE_URL } from '../../../content/landing';
import { metadata } from '../layout';
import CaseStudyPage from '../page';

const markup = renderToStaticMarkup(<CaseStudyPage />);

describe('/case-study', () => {
  it('renders the selected-workflow result and all three approaches', () => {
    expect(markup).toContain('Same observable result');
    expect(markup).toContain('Real Socket.IO');
    expect(markup).toContain('Exact published Smocket');
    expect(markup).toContain('Handwritten mock');
    expect(markup).toContain('socket.io@4.8.3');
    expect(markup).toContain('smocket@0.4.2');
  });

  it('preserves the authoritative interpretation and evidence boundaries', () => {
    expect(markup).toContain('authoritative interpretation');
    expect(markup).toContain('Fidelity');
    expect(markup).toContain('Reliability');
    expect(markup).toContain('Productivity');
    expect(markup).toContain('not a transport comparison');
    expect(markup).toContain('not evidence of continued success over time');
    expect(markup).toContain('not a productivity score');
  });

  it('retains neutral and unfavorable findings', () => {
    expect(markup).toContain('simpler in dependency installation and port setup');
    expect(markup).toContain('reference behavior without application-owned mock logic');
    expect(markup).toContain('one moderated, two-room workflow');
    expect(markup).toContain('author judgment');
  });

  it('renders reproducibility and pinned provenance', () => {
    expect(markup).toContain('pnpm case-study:chat-room');
    expect(markup).toContain('pnpm case-study:chat-room:check');
    expect(markup).toContain('node scripts/run-chat-room-case-study.mjs --target handwritten');
    expect(markup).toContain('fa90e07e272c7fd0db64ebfd73cbb104664ddb81');
    expect(markup).toContain('414b07fb27b70cc836d8b71d78d63a0f530d2cae28dbd32b60e77462a64f4bad');
    expect(markup).toContain('e3884c42af5987b4db154c7f13538054e405e12b496803b8d321ac9a409b62d5');
  });

  it('renders accessible controls for exploring the shared observation', () => {
    expect(markup).toContain('Inspect Real Socket.IO');
    expect(markup).toContain('Filter transcript by participant');
    expect(markup).toContain('Filter transcript by event');
    expect(markup).toContain('Explore structured observations');
    expect(markup).toContain('aria-pressed="true"');
  });

  it('publishes route metadata with the selected-workflow boundary', () => {
    expect(metadata.title).toBe('Application case study');
    expect(metadata.description).toContain('selected moderated chat-room workflow');
    expect(metadata.alternates).toEqual({ canonical: '/case-study' });
  });

  it('is discoverable from the footer and sitemap', () => {
    expect(footer.links).toContainEqual({
      label: 'Case study',
      href: '/case-study',
      todo: null,
    });
    expect(sitemap()).toContainEqual({
      url: `${SITE_URL}/case-study`,
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  });
});
