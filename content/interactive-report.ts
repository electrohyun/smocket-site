const SMOCKET_REPOSITORY = 'https://github.com/electrohyun/smocket';

export const report = {
  eyebrow: 'Interactive report · August 2026',
  title: 'Build the multi-user UI before the backend is ready.',
  introduction:
    'Smocket gives several same-origin browser tabs one in-browser server for frontend development. Real Socket.IO remains the path for integration, network, and production behavior.',
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
      'When the event contract exists but the backend is still being built, frontend work needs a temporary place for the server-side event flow.',
    paths: [
      {
        id: 'real',
        label: 'Real Socket.IO',
        title: 'Run the real server when you need real integration behavior.',
        body:
          'A small node:http process with Socket.IO is straightforward and is the right way to check transport, integration, and production behavior. It also brings a Node process, a listening port, and start/stop lifecycle alongside the frontend.',
      },
      {
        id: 'preview',
        label: 'Static preview gap',
        title: 'A static PR Preview does not carry that backend with it.',
        body:
          'A teammate can open a static preview URL, but the link alone cannot start a separate Socket.IO server environment. That environment needs its own setup or deployment.',
      },
      {
        id: 'smocket',
        label: 'SharedWorker Smocket',
        title: 'Keep the preview self-contained inside one browser profile.',
        body:
          'Same-origin tabs connect through MessagePorts to one caller-owned SharedWorker running Smocket. The team can review a multi-user frontend flow from a static URL before the real backend is ready.',
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
      'The report explains the visible flow and its Socket.IO-shaped events. The existing demo owns the actual drawing and guessing experience.',
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
        experience: 'A draws once; the lines appear in B and C without echoing back to A.',
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
    { id: 'stroke-recipients', value: '2', label: 'stroke recipient tabs', note: "B and C receive A's stroke; A is excluded." },
    { id: 'backend-process', value: '0', label: 'separate Socket.IO backends', note: 'The Smocket run still uses a web server to serve static assets.' },
    { id: 'socket-port', value: '0', label: 'Socket.IO listening ports', note: 'No separate real-time backend port exists in the Smocket run.' },
    { id: 'targets', value: '2/2', label: 'browser targets completed', note: 'Smocket and Real Socket.IO completed the same selected workflow.' },
  ],
  resultBoundary:
    'These values describe the selected drawing-game run, not Socket.IO-wide compatibility. Stroke totals vary with the drawing gesture, so this report does not invent a fixed total.',
  limits: [
    'The current automated browser result is desktop Chromium; other browser engines remain unverified.',
    'Tabs must share the same browser profile, origin, worker script URL, and worker name.',
    'State is not shared with another browser, browser profile, origin, or device.',
    'A Real Socket.IO path is still required for integration, transport, authentication, persistence, and production checks.',
    'Only the documented SharedWorker facade and the selected drawing-game workflow are compared here.',
    'This report does not claim complete Socket.IO API compatibility.',
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
