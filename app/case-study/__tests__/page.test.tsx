import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import sitemap from '../../sitemap';
import { footer, SITE_URL } from '../../../content/landing';
import { metadata } from '../layout';
import CaseStudyPage from '../page';

const markup = renderToStaticMarkup(<CaseStudyPage />);

describe('/case-study', () => {
  it('opens as a compact comparison report, not a marketing hero', () => {
    expect(markup).toContain('Chat-room application case study');
    expect(markup).toContain('Abstract');
    expect(markup).toContain('observable behavior matched');
    expect(markup).toContain('owned test-support surface differed');
    expect(markup).toContain('<p>01</p>');
    expect(markup).toContain('Research question &amp; method');
    expect(markup).toContain('<p>02</p>');
    expect(markup).toContain('Authored support surface');
    expect(markup).not.toContain('Same observable result. Different test support.');
  });

  it('makes the exact authored-surface comparison primary', () => {
    expect(markup).toContain('Real Socket.IO');
    expect(markup).toContain('Exact published Smocket');
    expect(markup).toContain('Handwritten mock');
    expect(markup).toContain('socket.io@4.8.3');
    expect(markup).toContain('smocket@0.4.2');
    expect(markup).toContain('61 lines');
    expect(markup).toContain('28 lines');
    expect(markup).toContain('28 + 212 lines');
    expect(markup).toContain('<table');
    expect(markup).toContain('HTTP server / port ownership');
    expect(markup).toContain('Explicit failure / debugging surface');
    expect(markup).toContain('Shared branches / workarounds');
  });

  it('connects shared code and workflow results to pinned implementation evidence', () => {
    expect(markup).toContain('<p>03</p>');
    expect(markup).toContain('Pinned implementation evidence');
    expect(markup).toContain('Select Real Socket.IO evidence');
    expect(markup).toContain('Real Socket.IO bootstrap');
    expect(markup).toContain('createServer');
    expect(markup).toContain('<p>04</p>');
    expect(markup).toContain('Workflow behavior matrix');
    expect(markup).toContain('Acknowledged joins');
    expect(markup).toContain('Passed · same observation');
    expect(markup).toContain('Shared expected value used by all three targets');
  });

  it('preserves the authoritative interpretation and evidence boundaries', () => {
    expect(markup).toContain('authoritative interpretation');
    expect(markup).toContain('Fidelity');
    expect(markup).toContain('Reliability');
    expect(markup).toContain('Productivity');
    expect(markup).toContain('not a transport comparison');
    expect(markup).toContain('not evidence of continued success over time');
    expect(markup).toContain('not a productivity score');
    expect(markup).toContain('Listeners register before their actions');
    expect(markup).toContain('not delays or timeouts');
  });

  it('retains neutral and unfavorable findings', () => {
    expect(markup).toContain('simpler in dependency installation and port setup');
    expect(markup).toContain('reference behavior without application-owned mock logic');
    expect(markup).toContain('one moderated, two-room workflow');
    expect(markup).toContain('author judgment');
    expect(markup).toContain('namespaces, middleware, reconnection, transport behavior');
  });

  it('renders reproducibility and pinned provenance', () => {
    expect(markup).toContain('pnpm case-study:chat-room');
    expect(markup).toContain('pnpm case-study:chat-room:check');
    expect(markup).toContain('node scripts/run-chat-room-case-study.mjs --target handwritten');
    expect(markup).toContain('fa90e07e272c7fd0db64ebfd73cbb104664ddb81');
    expect(markup).toContain('414b07fb27b70cc836d8b71d78d63a0f530d2cae28dbd32b60e77462a64f4bad');
    expect(markup).toContain('e3884c42af5987b4db154c7f13538054e405e12b496803b8d321ac9a409b62d5');
    expect(markup).toContain('app.js');
    expect(markup).toContain('scenario.js');
    expect(markup).toContain('assertions.js');
    expect(markup).toContain(
      '6a17477beef33fb014ab629b914d80a6f144b31b/docs/application-case-study.md',
    );
    expect(markup).not.toContain(
      'fa90e07e272c7fd0db64ebfd73cbb104664ddb81/docs/application-case-study.md',
    );
  });

  it('demotes the identical transcript to supporting evidence without a target selector', () => {
    expect(markup).toContain('<details');
    expect(markup).toContain('Supporting evidence: shared transcript');
    expect(markup).toContain('Filter transcript by participant');
    expect(markup).toContain('Filter transcript by event');
    expect(markup).not.toContain('Inspect Real Socket.IO');
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
