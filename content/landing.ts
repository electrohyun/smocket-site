export const REPO_URL = 'https://github.com/electrohyun/smocket';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://smocket-site.vercel.app';

export const hero = {
  id: 'hero',
  wordmark: 'smocket',
  mascot: {
    src: '/cat.webp',
    alt: 'smocket mascot: a cool cat wearing sunglasses',
  },
  h1: 'Test Socket.IO without a server.',
  h1Accent: 'without a server.',
  sub: "smocket reimplements Socket.IO's rooms, broadcasts, and acknowledgements in memory — and every release is verified against the real library.",
  tagline: 'Sweet setup, rocket speed.',
  chips: ['v0.5.1', 'dual-run CI', 'browser-tested'],
  ctas: [
    { label: 'Read the docs', href: `${REPO_URL}#readme`, primary: true },
    { label: 'View on GitHub', href: REPO_URL, primary: false },
  ],
  visual: {
    rocket: { src: '/rocket.webp', alt: 'a s’more rocket blasting off' },
    caption:
      'Packed like a s’more, aimed like a rocket. Each message reaches exactly the sockets it was addressed to, and no others.',
  },
} as const;

export const trace = {
  id: 'trace',
  title: 'See who received what.',
  desc: 'Rooms, exclusions, and targeted emits follow the supported delivery semantics verified against Socket.IO. Here is the delivery record.',
  sockets: [
    { label: 'A' },
    { label: 'B' },
    { label: 'C' },
  ],
  blocks: [
    {
      call: "socket_A.to('room-1').emit('stroke', { … })",
      reached: ['B', 'C'],
      excluded: ['A'],
    },
    {
      call: "io.to(sid_A).emit('word', 'giraffe')",
      reached: ['A'],
      excluded: [],
    },
    {
      call: "io.to('room-1').emit('chat', { … })",
      reached: ['A', 'B', 'C'],
      excluded: [],
    },
  ],
} as const;

export const pain = {
  id: 'pain',
  title: 'Before, a second player was out of reach.',
  before: {
    label: 'Hand-written mock',
    status: 'Enough for one client.',
    code: `// test/mock-socket.ts — before smocket
// A stand-in for socket.io, grown one test at a time.

type Handler = (...args: any[]) => void;

class MockSocket {
  id = 'socket-1';
  private handlers: Record<string, Handler[]> = {};

  on(event: string, fn: Handler) {
    (this.handlers[event] ??= []).push(fn);
  }

  emit(event: string, ...args: any[]) {
    // One socket means emit only calls its own handlers.
    // Rooms never enter into it.
    for (const fn of this.handlers[event] ?? []) {
      fn(...args);
    }
  }

  // Stored nowhere, read nowhere.
  join(_room: string) {}

  to(_room: string) {
    // Returning \`this\` sends every broadcast
    // back to this socket, whoever it was for.
    return this;
  }
}

// The harness assumes one client. A second MockSocket
// shares no rooms, so B never sees A's strokes.
const a = new MockSocket();`,
    todo: null,
  },
  after: {
    label: 'smocket',
    status: 'Built for rooms full of them.',
    code: `import { connect, Server } from 'smocket';

const io = new Server('http://localhost:3000');
const a = connect('http://localhost:3000');
const b = connect('http://localhost:3000');
const c = connect('http://localhost:3000');`,
  },
  caption: 'One handler map, and still nowhere for the second player to go.',
} as const;

export const features = {
  id: 'features',
  title: 'Built around Socket.IO behavior.',
  cards: [
    {
      title: 'Delivery fidelity',
      body: 'Rooms and socket ids live in the same bidirectional maps socket.io uses. Fan-out is a set operation, not a loop over guesses.',
    },
    {
      title: 'Checked against the real thing',
      body: 'Oracle-backed conformance cases run against both Socket.IO and smocket. Browser, SharedWorker, and packaging checks cover smocket-specific behavior.',
    },
    {
      title: 'No server, no ports',
      body: 'Nothing binds, nothing listens. Tests start and finish in the same process.',
    },
    {
      title: 'Honest about its limits',
      body: 'What a mock cannot have, smocket does not pretend to have. The list is short and written down.',
    },
  ],
} as const;

export const demo = {
  id: 'demo',
  title: 'Three players, one page, no server.',
  /* The delivery record is the section above this one's argument; saying it twice
     would make the demo a second Trace. What this section has that Trace does not
     is the other two people — so the copy is about them. */
  desc: 'One person draws. The other two watch the lines arrive and say what they think it is. Every stroke and every guess is a Socket.IO event, routed here in the page.',
  href: '/demo',
  cta: 'Take the pen',
  preview: {
    /* The drawing is a recording and the frame says so. The routing is not — it
       runs again on every visit — so the sentence is about the round, not about
       what the reader is watching happen to it.

       No claim about speed: it plays at the speed it was drawn, so there is
       nothing to declare, and a reader who has asked for reduced motion is shown
       the finished round with no replay in it at all. */
    note: 'A recorded round, replayed.',
    replay: 'Play again',
    /* The frame is a single image to a screen reader, so this has to carry what
       the drawing and the guesses together say. */
    alt: 'A recorded round of the drawing game: a giraffe appears stroke by stroke while two players guess — a horse, then a deer — until the spots land and the second player answers giraffe.',
  },
} as const;

export const quickstart = {
  id: 'quickstart',
  title: 'Switch in three steps.',
  steps: [
    {
      n: 1,
      title: 'Install',
      code: 'npm install -D smocket smocket-client',
      isTodo: false,
    },
    {
      n: 2,
      title: 'Alias the client',
      code: `// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { 'socket.io-client': 'smocket-client' },
  },
});`,
      isTodo: false,
    },
    {
      n: 3,
      title: 'Run your app code',
      code: `import { expect, it } from 'vitest';
import { Server, type ServerSocketContract } from 'smocket';
import { joinChat } from '../src/chat';

it('delivers a room message to the other member', async () => {
  const url = 'http://localhost:3000';
  const io = new Server(url);

  io.on('connection', (socket: ServerSocketContract) => {
    socket.on('join', (room: string, ack: () => void) => {
      void socket.join(room);
      ack();
      socket.on('message', (text: string) => {
        socket.to(room).emit('message', text);
      });
    });
  });

  // joinChat still imports io from socket.io-client.
  const a = joinChat(url, 'alice', 'general');
  const b = joinChat(url, 'bob', 'general');
  await Promise.all([a.ready, b.ready]);

  const heard = new Promise((resolve) => b.onMessage(resolve));
  a.send('hello');

  await expect(heard).resolves.toBe('hello');
});`,
      isTodo: false,
    },
  ],
} as const;

export const scope = {
  id: 'scope',
  doTitle: 'What smocket does',
  does: [
    'Rooms and namespaces',
    'Broadcast, with and without exclusions',
    'Targeted emits by socket id',
    'Acknowledgements, including timeouts',
    'Middleware, handshake, and per-socket data',
    'Disconnect cleanup',
  ],
  cannotTitle: 'What a mock cannot have',
  cannot: [
    'Reconnection behaviour — there is no "later" to wait for',
    'Transport fallback — there is no transport',
    'Heartbeat — there is no connection to check',
    'Multi-server adapters — there is one process',
    'Binary encoding — nothing is serialised',
  ],
} as const;

type FooterLink = { label: string; href: string | null; todo: string | null };

export const footer = {
  id: 'footer',
  tagline: 'Sweet setup, rocket speed.',
  links: [
    { label: 'Docs', href: '/docs', todo: null },
    { label: 'Interactive report', href: '/case-study', todo: null },
    { label: 'GitHub', href: REPO_URL, todo: null },
    { label: 'npm', href: 'https://www.npmjs.com/package/smocket', todo: null },
    { label: 'MIT', href: `${REPO_URL}/blob/main/LICENSE`, todo: null },
  ] as FooterLink[],
  builtBy: 'Built by electrohyun.',
} as const;
