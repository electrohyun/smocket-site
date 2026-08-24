import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { footer, SITE_URL } from '../../../content/landing';
import { report } from '../../../content/interactive-report';
import sitemap from '../../sitemap';
import { metadata } from '../layout';
import CaseStudyPage from '../page';

const markup = renderToStaticMarkup(<CaseStudyPage />);

describe('/case-study interactive report', () => {
  it('renders exactly the four current report sections at the existing route', () => {
    expect(markup).toContain('id="problem"');
    expect(markup).toContain('id="architecture"');
    expect(markup).toContain('id="scenario"');
    expect(markup).toContain('id="results"');
    expect(markup.match(/class="[^\"]*sectionHeading/g)).toHaveLength(4);
    expect(markup.match(/class="[^\"]*sectionNumber/g)).toHaveLength(4);
    expect(markup).toContain('Smocket SharedWorker: a three-tab report');
    expect(markup).toContain('Three same-origin browser tabs');
    expect(markup).toContain('SharedWorker + Smocket');
    expect(markup).toContain('The preview handoff');
    expect(markup).toContain('Architecture by development stage');
    expect(markup).toContain('A three-tab drawing round');
    expect(markup).toContain('Drawing-game verification results');
  });

  it('separates Real Socket.IO and SharedWorker Smocket without ranking them', () => {
    expect(markup).toContain('Real Socket.IO');
    expect(markup).toContain('Node HTTP + Socket.IO Server');
    expect(markup).toContain('WebSocket');
    expect(markup).toContain('SharedWorker + Smocket');
    expect(markup).toContain('MessagePort');
    expect(markup).toContain('Integration and production behavior');
    expect(markup).toContain('Pre-backend frontend development and static PR Preview');
    expect(markup).not.toContain('always better');
    expect(markup).not.toContain('complete compatibility');
  });

  it('explains the event flow and links to the existing demo instead of embedding it', () => {
    for (const event of ['CONNECT ×3', 'JOIN', 'ROUND_STARTED', 'STROKE ×N', 'GUESS', 'ROUND_WON ×3']) {
      expect(markup).toContain(event);
    }
    expect(markup).toContain('href="/demo/multi"');
    expect(markup).toContain('target="_blank"');
    expect(markup).not.toContain('canvas');
    expect(markup).not.toContain('Guess from the drawing');
  });

  it('uses only the traceable current drawing-game results and states their boundary', () => {
    for (const result of report.results) {
      expect(markup).toContain(result.value);
      expect(markup).toContain(result.label);
    }
    expect(markup).toContain(report.provenance.sourceCommit);
    expect(markup).toContain(report.provenance.command);
    expect(markup).toContain('Socket.IO-wide compatibility is outside this measurement');
    expect(markup).toContain('stroke totals vary by gesture');
    expect(markup).not.toContain('28 + 212');
    expect(markup).not.toContain('Handwritten mock');
    expect(markup).not.toContain('mock-socket');
  });

  it('publishes current metadata and preserves discoverability', () => {
    expect(metadata.title).toBe('Smocket interactive report');
    expect(metadata.description).toContain('SharedWorker Smocket');
    expect(metadata.alternates).toEqual({ canonical: '/case-study' });
    expect(metadata.openGraph).toMatchObject({ url: '/case-study', title: 'Smocket interactive report' });
    expect(footer.links).toContainEqual({ label: 'Interactive report', href: '/case-study', todo: null });
    expect(sitemap()).toContainEqual({
      url: `${SITE_URL}/case-study`,
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  });
});
