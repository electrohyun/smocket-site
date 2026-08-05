export const REPO_URL = 'https://github.com/electrohyun/smocket';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://smocket-site.vercel.app';

export const hero = {
  id: 'hero',
  wordmark: 'smocket',
  mascot: {
    src: '/cat.webp',
    alt: 'smocket mascot: a cool cat wearing sunglasses',
  },
  h1: 'Test socket.io without a server.',
  h1Accent: 'without a server.',
  sub: "smocket reimplements socket.io's rooms, broadcasts, and acknowledgements in memory — and every release is verified against the real library.",
  tagline: 'Sweet setup, rocket speed.',
  chips: ['MIT', 'v0.3.0', 'dual-run CI'],
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
  desc: 'Rooms, exclusions, and targeted emits resolve exactly the way socket.io resolves them. Here is the delivery record.',
  sockets: [
    { label: 'A', sid: 'a3f1' },
    { label: 'B', sid: 'b7c2' },
    { label: 'C', sid: 'c9e4' },
  ],
  blocks: [
    {
      call: "socket_A.to('room-1').emit('stroke', { … })",
      reach: '→ B, C   (except A)',
    },
    {
      call: "io.to(sid_A).emit('word', 'giraffe')",
      reach: '→ A',
    },
    {
      call: "io.to('room-1').emit('chat', { … })",
      reach: '→ A, B, C',
    },
  ],
} as const;

export const pain = {
  id: 'pain',
  title: 'Before, a second player was out of reach.',
  before: {
    label: 'Hand-written mock',
    code: `// polycasso/test/mock-socket.ts — before smocket
// A stand-in for socket.io, grown one test at a time.

type Handler = (...args: any[]) => void;

class MockSocket {
  id = 'socket-1';
  private handlers: Record<string, Handler[]> = {};

  on(event: string, fn: Handler) {
    (this.handlers[event] ??= []).push(fn);
  }

  emit(event: string, ...args: any[]) {
    // Only ever one socket, so emit just fans out to whatever
    // this socket registered. Rooms don't enter into it.
    for (const fn of this.handlers[event] ?? []) fn(...args);
  }

  join(_room: string) {} // stored nowhere, read nowhere
  to(_room: string) {
    // The quick fix was to return \`this\`, so every ".to(room)"
    // broadcast lands back on this same socket — whoever it was for.
    return this;
  }
}

// The harness assumes a single client. A second MockSocket shares no
// room map with the first, so player B never sees player A's strokes.
const socket = new MockSocket();`,
    todo: null,
  },
  after: {
    label: 'smocket',
    code: `import { connect, Server } from 'smocket';

const io = new Server('http://localhost:3000');
const a = connect('http://localhost:3000');
const b = connect('http://localhost:3000');
const c = connect('http://localhost:3000');`,
  },
  caption: '190 lines of hand-written mock, and still only one player could connect.',
} as const;

export const features = {
  id: 'features',
  cards: [
    {
      title: 'Delivery fidelity',
      body: 'Rooms and socket ids live in the same bidirectional maps socket.io uses. Fan-out is a set operation, not a loop over guesses.',
    },
    {
      title: 'Checked against the real thing',
      body: 'Every test runs twice: once against socket.io, once against smocket. A behavioural difference turns CI red.',
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
  desc: 'One person draws, two watch, and the delivery record on the right shows which socket received each event.',
  href: '/demo',
  shotTodo: 'TODO(hyun): demo screenshot',
  linkTodo: 'TODO(hyun): copy needed — demo entry link',
} as const;

export const quickstart = {
  id: 'quickstart',
  title: 'Three steps.',
  steps: [
    {
      n: 1,
      title: 'Install',
      code: 'npm install -D smocket',
      isTodo: false,
    },
    {
      n: 2,
      title: 'Change the import',
      code: `- import { Server } from 'socket.io';
+ import { Server } from 'smocket';`,
      isTodo: false,
    },
    {
      n: 3,
      title: 'Run the test',
      code: `import { expect, it } from 'vitest';
import { connect, Server } from 'smocket';

const received = (client, event) =>
  new Promise((resolve) => client.once(event, resolve));

it('a room broadcast reaches the room and excludes the sender', async () => {
  const io = new Server('http://localhost:3000');

  const a = connect('http://localhost:3000');
  const b = connect('http://localhost:3000');
  const c = connect('http://localhost:3000');

  const socketA = await io.nextConnection();
  const socketB = await io.nextConnection();
  const socketC = await io.nextConnection();

  await socketA.join('room-1');
  await socketB.join('room-1');
  await socketC.join('room-1');

  let aReceived = false;
  a.on('stroke', () => (aReceived = true));
  const onB = received(b, 'stroke');
  const onC = received(c, 'stroke');

  // socket.to(room) delivers to the room and excludes the sender.
  socketA.to('room-1').emit('stroke', { x: 1, y: 2 });

  expect(await onB).toEqual({ x: 1, y: 2 });
  expect(await onC).toEqual({ x: 1, y: 2 });
  expect(aReceived).toBe(false);
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
    'Acknowledgements',
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
    { label: 'Docs', href: `${REPO_URL}#readme`, todo: null },
    { label: 'GitHub', href: REPO_URL, todo: null },
    { label: 'npm', href: 'https://www.npmjs.com/package/smocket', todo: null },
    { label: 'MIT', href: `${REPO_URL}/blob/main/LICENSE`, todo: null },
  ] as FooterLink[],
  builtBy: 'Built by electrohyun.',
} as const;
