import { describe, expect, it } from 'vitest';
import packageJson from '../../package.json';
import { features, footer, hero, pain, quickstart, SMOCKET_VERSION, trace } from '../landing';

describe('landing publication links', () => {
  it('shows the current release and routes footer readers to the docs proxy', () => {
    expect(SMOCKET_VERSION).toBe('1.0.0');
    expect(packageJson.dependencies.smocket).toBe(SMOCKET_VERSION);
    expect(packageJson.dependencies['smocket-client']).toBe(SMOCKET_VERSION);
    expect(hero.chips).toContain(`v${SMOCKET_VERSION}`);
    expect(hero.h1).toBe('Mock Socket.IO without a server.');
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

  it('compares Smocket with a separate Node.js Socket.IO mock server', () => {
    expect(pain.title).toBe('Use your Socket.IO handlers without starting a network server.');
    expect(pain.before.label).toBe('Node.js Socket.IO mock server');
    expect(pain.before.status).toBe('HTTP server, listening port, and cleanup.');
    expect(pain.before.code).toContain("httpServer.listen(0, '127.0.0.1')");
    expect(pain.before.code).toContain("import { Server } from 'socket.io'");
    expect(pain.after.code).toContain('registerApplication(io)');
    expect(pain.after.code).toContain("import { Server } from 'smocket'");
    expect(pain.after.code).toContain("import { connect } from 'smocket-client'");
    expect(pain.after.status).toBe('The same handlers, no listening server.');
    expect(pain.caption).toBe('registerApplication(io) stays the same.');
    expect(pain.before.code).not.toContain('class MockSocket');
  });
});
