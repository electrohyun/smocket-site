const SMOCKET_REPOSITORY = 'https://github.com/electrohyun/smocket';

export const report = {
  eyebrow: 'Interactive report · August 2026',
  title: 'Smocket SharedWorker: a three-tab report',
  introduction:
    'An interactive report on frontend previews, event flow, and the boundary with real Socket.IO.',
  thesis:
    'Verify real behavior with Socket.IO. Build multi-user UI and share static previews before the backend is ready with Smocket.',
  supportingLine: 'Multiple tabs, one in-browser Smocket server, no separate Socket.IO backend.',
  navigation: [
    { number: '01', label: 'The preview gap', href: '#problem' },
    { number: '02', label: 'Two architectures', href: '#architecture' },
    { number: '03', label: 'Three-tab flow', href: '#scenario' },
    { number: '04', label: 'Results & limits', href: '#results' },
  ],
  problem: {
    intro:
      'A shared event contract lets frontend work continue while the backend is being built. The server-side event flow needs a temporary runtime.',
    paths: [
      {
        id: 'real',
        label: 'Real Socket.IO',
        title: 'Use the real server for integration checks.',
        body:
          'A node:http process with Socket.IO checks transport, integration, and production behavior. It runs beside the frontend with its own process, port, and lifecycle.',
      },
      {
        id: 'preview',
        label: 'Static preview gap',
        title: 'The frontend and real backend deploy separately.',
        body:
          'A preview URL delivers the frontend. Sharing the complete experience also requires a separately configured or deployed Socket.IO server.',
      },
      {
        id: 'smocket',
        label: 'SharedWorker Smocket',
        title: 'Run the preview server inside the browser.',
        body:
          'Same-origin tabs connect through MessagePorts to one SharedWorker running Smocket. A static URL can then carry the multi-user frontend flow while the backend is in progress.',
      },
    ],
  },
  architectures: [
    {
      id: 'socket-io',
      tabLabel: 'Real Socket.IO',
      title: 'Node HTTP + Socket.IO Server',
      transport: 'WebSocket',
      role: 'Integration and production behavior',
      timing: 'Use when the real backend path is available or the network path is the subject of the check.',
      detail:
        'Three browser tabs connect over the network to one external Node HTTP and Socket.IO server.',
    },
    {
      id: 'smocket',
      tabLabel: 'Smocket preview',
      title: 'SharedWorker + Smocket',
      transport: 'MessagePort',
      role: 'Pre-backend frontend development and static PR Preview',
      timing: 'Use while building and sharing the multi-user UI before a real backend is ready.',
      detail:
        'Three same-origin tabs connect to one caller-owned SharedWorker and share its in-memory Smocket server.',
    },
  ],
  scenario: {
    intro:
      'Follow the visible flow and the Socket.IO-shaped events behind it. Continue to the demo for the drawing and guessing experience.',
    steps: [
      {
        id: 'connect',
        event: 'CONNECT ×3',
        label: 'Open three player tabs',
        experience: 'Player A opens Players B and C. Each page receives a distinct socket ID.',
        exchange: 'Three page connections enter one SharedWorker-hosted server.',
      },
      {
        id: 'join',
        event: 'JOIN',
        label: 'Join one game session',
        experience: 'The three players appear in the same room and see the same participant state.',
        exchange: 'Each page emits join-session and receives an acknowledgement plus session state.',
      },
      {
        id: 'round',
        event: 'ROUND_STARTED',
        label: 'Start together',
        experience: 'When all three players are present, the countdown completes and the round starts.',
        exchange: 'The server publishes session-state, round-started, and the private word for Player A.',
      },
      {
        id: 'stroke',
        event: 'STROKE ×N',
        label: 'Draw in Player A',
        experience: 'A draws once. B and C receive the lines while A keeps its local drawing.',
        exchange: 'A emits stroke. socket.to(session) broadcasts each segment to the other two sockets.',
      },
      {
        id: 'guess',
        event: 'GUESS',
        label: 'Submit a chat guess',
        experience: 'A guess appears in the shared chat and the submitting tab receives its result.',
        exchange: 'The guess event carries an acknowledgement. Wrong and correct results remain explicit.',
      },
      {
        id: 'won',
        event: 'ROUND_WON ×3',
        label: 'End on all three screens',
        experience: 'A correct answer reveals the same winner and word on every player page.',
        exchange: 'The server broadcasts round-ended to the whole session.',
      },
    ],
  },
  results: [
    { id: 'clients', value: '3', label: 'browser pages', note: 'A, B, and C use distinct socket IDs.' },
    { id: 'room', value: '1', label: 'shared game session', note: 'All three pages observe the same room state.' },
    { id: 'stroke-recipients', value: '2', label: 'stroke recipient tabs', note: 'The room broadcast reaches B and C.' },
    { id: 'backend-process', value: '0', label: 'separate Socket.IO backends', note: 'Static assets remain served over HTTP.' },
    { id: 'socket-port', value: '0', label: 'Socket.IO listening ports', note: 'Real-time messages travel through MessagePorts.' },
    { id: 'targets', value: '2/2', label: 'browser targets completed', note: 'Smocket and Real Socket.IO completed the same selected workflow.' },
  ],
  resultBoundary:
    'These values cover the selected drawing-game workflow. Socket.IO-wide compatibility is outside this measurement. The board contains stable counts; stroke totals vary by gesture.',
  limits: [
    'The current automated browser result is desktop Chromium; other browser engines remain unverified.',
    'Tabs must share the same browser profile, origin, worker script URL, and worker name.',
    'State stays within one browser profile and origin; each browser or device has its own state.',
    'Real Socket.IO remains the verification path for integration, transport, authentication, persistence, and production.',
    'Comparison scope: the documented SharedWorker facade and selected drawing-game workflow.',
    'Compatibility coverage is limited to the documented API and selected workflow.',
    'When the SharedWorker terminates or restarts, its in-memory sockets, rooms, state, and pending acknowledgements are lost.',
  ],
  provenance: {
    sourceRepository: SMOCKET_REPOSITORY,
    sourceCommit: '5bf724876e79faba0883ec2c349c6c79baaae87e',
    packageVersion: '0.5.1',
    verifiedOn: '2026-08-24',
    command: 'pnpm example:drawing-game:verify',
    outcome: 'Drawing game passed the same three-page workflow with Smocket and Real Socket.IO.',
    sourceFiles: [
      'examples/drawing-game/verify.mjs',
      'examples/drawing-game/src/game/game-handler.ts',
      'examples/drawing-game/src/shared-worker.ts',
      'examples/drawing-game/src/connections/shared-worker-client.ts',
    ],
  },
  links: [
    { label: 'GitHub', href: SMOCKET_REPOSITORY },
    { label: 'README', href: `${SMOCKET_REPOSITORY}#readme` },
    { label: 'Runnable Example', href: `${SMOCKET_REPOSITORY}/tree/main/examples/drawing-game` },
    { label: 'Open the 3-tab demo', href: '/demo/multi' },
  ],
} as const;

export type ArchitectureId = (typeof report.architectures)[number]['id'];
export type ScenarioStepId = (typeof report.scenario.steps)[number]['id'];
