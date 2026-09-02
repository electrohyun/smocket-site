import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { footer, SITE_URL } from '../../../content/landing';
import { report } from '../../../content/interactive-report';
import sitemap from '../../sitemap';
import { metadata } from '../layout';
import CaseStudyPage from '../page';

const markup = renderToStaticMarkup(<CaseStudyPage />);

describe('/case-study application case study', () => {
  it('renders the four application-focused sections at the existing route', () => {
    for (const id of ['roles', 'runtimes', 'application', 'results']) {
      expect(markup).toContain(`id="${id}"`);
    }
    expect(markup.match(/class="[^\"]*sectionHeading/g)).toHaveLength(4);
    expect(markup.match(/class="[^\"]*sectionNumber/g)).toHaveLength(4);
    expect(markup).toContain('Socket.IO mocking without a separate Node.js server');
    expect(markup).toContain('Smocket runs your Socket.IO server logic in memory.');
    expect(markup).toContain('Two jobs, one application');
    expect(markup).toContain('Where Smocket runs');
    expect(markup).toContain('One application, two bootstraps');
    expect(markup).toContain('Observed behavior and boundaries');
  });

  it('gives the Node.js Socket.IO mock server and Smocket separate roles', () => {
    expect(markup).toContain('Run a separate mock server process');
    expect(markup).toContain('Run mock server behavior in memory');
    expect(markup).toContain('Use when the network connection should remain part of the local setup.');
    expect(markup).toContain('Use for focused development and application tests.');
    expect(markup).toContain('It does not replace the production backend.');
    expect(markup).not.toContain('always better');
    expect(markup).not.toContain('complete compatibility');
  });

  it('shows Node tests, browser, SharedWorker, and Node server runtime contexts', () => {
    for (const runtime of report.runtimes) {
      expect(markup).toContain(runtime.tabLabel);
      expect(markup).toContain(runtime.title);
    }
    expect(report.runtimes.map((runtime) => runtime.connection)).toEqual([
      'In-memory client and server',
      'In-memory Smocket client and server',
      'MessagePort through the SharedWorker adapter',
      'Socket.IO transport over the network',
    ]);
  });

  it('shows shared application code, two bootstraps, and the drawing flow', () => {
    expect(markup).toContain('registerDrawingGameApplication');
    expect(markup).toContain('new SocketIoServer(httpServer)');
    expect(markup).toContain('attachSharedWorker(io, port)');
    for (const event of ['CONNECT ×3', 'JOIN', 'ROUND_STARTED', 'STROKE ×N', 'GUESS', 'ROUND_WON ×3']) {
      expect(markup).toContain(event);
    }
    expect(markup).toContain('href="/demo/multi"');
    expect(markup).toContain('target="_blank"');
  });

  it('presents selected behavior as a table and states the runtime boundaries', () => {
    for (const row of report.observedBehavior) {
      expect(markup).toContain(row.behavior);
    }
    expect(markup).toContain(report.source.commit);
    expect(markup).toContain(report.source.command);
    expect(markup).toContain('Production network and integration behavior');
    expect(markup).toContain('One browser profile and origin');
    expect(markup).not.toContain('Handwritten mock');
    expect(markup).not.toContain('mock-socket');
  });

  it('publishes current metadata and preserves discoverability', () => {
    expect(metadata.title).toBe('Smocket application case study');
    expect(metadata.description).toContain('Node.js mock server built with Socket.IO');
    expect(metadata.alternates).toEqual({ canonical: '/case-study' });
    expect(metadata.openGraph).toMatchObject({ url: '/case-study', title: 'Smocket application case study' });
    expect(footer.links).toContainEqual({ label: 'Interactive report', href: '/case-study', todo: null });
    expect(sitemap()).toContainEqual({
      url: `${SITE_URL}/case-study`,
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  });
});
