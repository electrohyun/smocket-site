// smocket-site 랜딩 페이지의 모든 문구 출처.
// 출처 문서: smocket-site_카피_원본.md (여기 없는 문구는 지어내지 말고 TODO(hyun)로 남길 것)
// 순서·문구를 바꿔가며 볼 것이므로 교체가 쉬워야 한다 (지시서 §4.1).

export const REPO_URL = 'https://github.com/electrohyun/smocket';

// §1 Hero ------------------------------------------------------------------
export const hero = {
  id: 'hero',
  wordmark: 'smocket',
  // 워드마크 옆 마스코트 (로컬 에셋, 외부요청 없음).
  mascot: {
    src: '/cat.webp',
    alt: 'smocket mascot: a cool cat wearing sunglasses',
  },
  // H1: 카피 §1 3안 중 B안 확정 (기현 선택). h1Accent 부분은 오렌지 강조.
  h1: 'Test socket.io without a server.',
  h1Accent: 'without a server.',
  sub: "smocket reimplements socket.io's rooms, broadcasts, and acknowledgements in memory — and every release is verified against the real library.",
  tagline: 'Sweet setup, rocket speed.', // 카피 §1 태그라인 (히어로에도 노출)
  // 칩: 레포 기준 실제 값. MIT(package.json license), v0.3.0(현재 npm 배포 버전),
  // dual-run CI(README의 real+mock 컨포먼스 CI). 릴리스 올라가면 버전만 갱신.
  chips: ['MIT', 'v0.3.0', 'dual-run CI'],
  ctas: [
    { label: 'Read the docs', href: `${REPO_URL}#readme`, primary: true },
    { label: 'View on GitHub', href: REPO_URL, primary: false },
  ],
  // 히어로 주인공: 스모어 로켓 (투명 에셋) + 흐린 성좌 배경.
  visual: {
    rocket: { src: '/rocket.webp', alt: 'a s’more rocket blasting off' },
    // 내가 쓴 문학 카피 (검토용, 교체 가능). em-dash 미사용.
    caption:
      'Packed like a s’more, aimed like a rocket. Each message reaches exactly the sockets it was addressed to, and no others.',
  },
} as const;

// §2 Trace -----------------------------------------------------------------
export const trace = {
  id: 'trace',
  title: 'See who received what.',
  desc: 'Rooms, exclusions, and targeted emits resolve exactly the way socket.io resolves them. Here is the delivery record.',
  // 라벨 A/B/C + sid 앞 4자리 (지시서 §3-2). 예시 mock sid.
  sockets: [
    { label: 'A', sid: 'a3f1' },
    { label: 'B', sid: 'b7c2' },
    { label: 'C', sid: 'c9e4' },
  ],
  // 하드코딩, 그대로 사용 (카피 §2). 배달식을 지어내지 말 것.
  blocks: [
    {
      call: "io.to('room-1').except(sid_A).emit('stroke', { … })",
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

// §3 Pain ------------------------------------------------------------------
export const pain = {
  id: 'pain',
  title: 'Before, a second player was out of reach.',
  before: {
    label: 'Hand-written mock',
    // 폴리카소(그림 대결)용으로 손으로 짠 MockSocket 발췌.
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
    // 실제 공개 API와 대조 완료 (레포 README Usage / ADR 0003 url-is-required).
    // Server(url) 필수, connect(url)로 클라이언트가 붙는다.
    code: `import { connect, Server } from 'smocket';

const io = new Server('http://localhost:3000');
const a = connect('http://localhost:3000');
const b = connect('http://localhost:3000');
const c = connect('http://localhost:3000');`,
  },
  caption: '190 lines of hand-written mock, and still only one player could connect.',
} as const;

// §4 Features --------------------------------------------------------------
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

// §5 Demo ------------------------------------------------------------------
export const demo = {
  id: 'demo',
  title: 'Three players, one page, no server.',
  desc: 'One person draws, two watch, and the delivery record on the right shows which socket received each event.',
  placeholder: 'TODO: drawing demo', // 이번 라운드에서는 만들지 않음 (지시서 §3-5)
} as const;

// §6 Quick start -----------------------------------------------------------
export const quickstart = {
  id: 'quickstart',
  title: 'Three steps.',
  steps: [
    {
      n: 1,
      title: 'Install',
      code: 'npm install -D smocket', // 레포 README Install / npm에 v0.3.0 배포됨
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
      // 공개 API(connect, Server)만 사용. smocket 레포에서 실제로 실행해 통과 확인함.
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

// §7 Scope -----------------------------------------------------------------
export const scope = {
  id: 'scope',
  doTitle: 'What smocket does',
  // 실제 API 표면과 대조 완료 (레포 README Features / src 테스트).
  // 'Middleware and per-socket data'는 현 릴리스에 없어 제거 (지시서 §7: 없는 항목은 지운다).
  does: [
    'Rooms and namespaces',
    'Broadcast, with and without exclusions',
    'Targeted emits by socket id',
    'Acknowledgements',
    'Disconnect cleanup',
  ],
  cannotTitle: 'What a mock cannot have',
  // 문구를 바꾸지 말 것 (카피 §7)
  cannot: [
    'Reconnection behaviour — there is no "later" to wait for',
    'Transport fallback — there is no transport',
    'Heartbeat — there is no connection to check',
    'Multi-server adapters — there is one process',
    'Binary encoding — nothing is serialised',
  ],
} as const;

// §8 Footer ----------------------------------------------------------------
// href가 없는 링크는 todo로 노출한다(§3-8). 링크가 다 채워져도 이 갈래가 살아있게
// 명시 타입을 준다 (전부 href면 as const 리터럴 narrowing이 todo 갈래를 never로 만듦).
type FooterLink = { label: string; href: string | null; todo: string | null };

export const footer = {
  id: 'footer',
  tagline: 'Sweet setup, rocket speed.', // 카피 §1 태그라인 — 워드마크 옆
  links: [
    { label: 'Docs', href: `${REPO_URL}#readme`, todo: null },
    { label: 'GitHub', href: REPO_URL, todo: null },
    { label: 'npm', href: 'https://www.npmjs.com/package/smocket', todo: null }, // v0.3.0 배포됨
    { label: 'MIT', href: `${REPO_URL}/blob/main/LICENSE`, todo: null },
  ] as FooterLink[],
  builtBy: 'Built by electrohyun.',
} as const;
