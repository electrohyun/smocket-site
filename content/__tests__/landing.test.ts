import { describe, expect, it } from 'vitest';
import { features, footer, hero, quickstart, trace } from '../landing';

describe('landing publication links', () => {
  it('shows the current release and routes footer readers to the docs proxy', () => {
    expect(hero.chips).toContain('v0.5.1');
    expect(hero.chips).not.toContain('v0.4.1');
    expect(footer.links).toContainEqual({ label: 'Docs', href: '/docs', todo: null });
  });

  it('describes the supported comparison and installs both package roles', () => {
    expect(trace.desc).not.toContain('resolve exactly');
    expect(features.cards[1].body).toContain(
      'Oracle-backed conformance cases run against both Socket.IO and smocket.',
    );
    expect(features.cards[1].body).not.toContain('Every test runs twice');
    expect(quickstart.steps[0].code).toBe('npm install -D smocket smocket-client');
    expect(quickstart.steps[1].code).toContain("'socket.io-client': 'smocket-client'");
  });
});
