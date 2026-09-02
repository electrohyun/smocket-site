const SMOCKET_REPOSITORY = 'https://github.com/electrohyun/smocket';

export const report = {
  eyebrow: 'Application case study · Smocket 1.0.0',
  title: 'One Socket.IO application, two ways to run it',
  introduction:
    'The drawing game keeps one server-side event flow and runs it with either Real Socket.IO or Smocket.',
  thesis: 'Keep the application logic. Change the runtime at the boundary.',
  supportingLine:
    'Use Real Socket.IO when the network matters. Use Smocket when the application flow is the work.',
  coverFacts: [
    { label: 'Application', value: 'Three-player drawing game' },
    { label: 'Shared code', value: 'Server event handlers' },
    { label: 'Runtimes', value: 'Socket.IO + Smocket' },
  ],
  navigation: [
    { number: '01', label: 'Roles', href: '#roles' },
    { number: '02', label: 'Where it runs', href: '#runtimes' },
    { number: '03', label: 'Shared application', href: '#application' },
    { number: '04', label: 'Results & limits', href: '#results' },
  ],
  roles: {
    intro:
      'Smocket does not replace the real server. Each runtime answers a different question while the application code stays shared.',
    items: [
      {
        id: 'socket-io',
        label: 'Real Socket.IO',
        title: 'Does the complete network path work?',
        body:
          'Run the Node server for transport, authentication, reconnection, persistence, deployment, and production integration.',
        useWhen: 'Use for integration checks and production.',
      },
      {
        id: 'smocket',
        label: 'Smocket',
        title: 'Does the frontend application flow work?',
        body:
          'Run the same handlers in memory for server-driven UI, rooms, broadcasts, acknowledgements, and multi-client application tests.',
        useWhen: 'Use for focused development and application tests.',
      },
    ],
  },
  runtimes: [
    {
      id: 'node-test',
      tabLabel: 'Node tests',
      title: 'Application tests in Node.js',
      host: 'Vitest or another Node.js test runner',
      connection: 'In-memory client and server',
      detail:
        'Create a Smocket server inside the test, connect multiple clients, and assert the application event flow without opening a port.',
      timing: 'Best for repeatable tests of rooms, broadcasts, acknowledgements, and server-driven state.',
    },
    {
      id: 'browser',
      tabLabel: 'Browser page',
      title: 'Frontend development in one page',
      host: 'The browser page',
      connection: 'In-memory Smocket client and server',
      detail:
        'Run the server beside the frontend when a page or component needs realistic Socket.IO-shaped events during development.',
      timing: 'Best for building UI states without starting a separate Node server.',
    },
    {
      id: 'shared-worker',
      tabLabel: 'SharedWorker tabs',
      title: 'One browser server for several tabs',
      host: 'A caller-owned SharedWorker',
      connection: 'MessagePort through the SharedWorker adapter',
      detail:
        'Place Smocket in a SharedWorker when same-origin tabs need to share one in-memory server and application state.',
      timing: 'Best for a multi-tab browser preview such as the drawing-game demo.',
    },
    {
      id: 'real-server',
      tabLabel: 'Real server',
      title: 'The complete Socket.IO path',
      host: 'Node HTTP + Socket.IO server',
      connection: 'Socket.IO transport over the network',
      detail:
        'Attach the shared application to the real Socket.IO server when the network path and backend integration are part of the work.',
      timing: 'Required before treating transport and production integration as complete.',
    },
  ],
  application: {
    intro:
      'The drawing game registers one application function. Only the code that creates and connects the server changes.',
    snippets: [
      {
        id: 'shared',
        label: 'Shared application',
        title: 'Register the drawing-game event flow once',
        code: `export function registerDrawingGameApplication(io: GameServer) {
  const state = new DrawingGameState();

  io.on('connection', (socket) => {
    const actions: GameActions = {
      join(current, room) {
        return state.join(current, room);
      },
      stroke(current, segment) {
        return state.rememberStroke(current, segment);
      },
      // Chat, guess, and disconnect use the same state.
    };

    registerGameHandler(io, socket, actions);
  });
}`,
        note: 'Join, stroke, chat, guess, room state, and disconnect rules live behind this boundary.',
      },
      {
        id: 'socket-io',
        label: 'Real Socket.IO bootstrap',
        title: 'Attach the application to the Node HTTP server',
        code: `const io = new SocketIoServer(httpServer);

registerDrawingGameApplication(io, {
  countdownMs,
});`,
        note: 'The real runtime owns the network transport and production integration.',
      },
      {
        id: 'smocket',
        label: 'Smocket bootstrap',
        title: 'Attach the application to a SharedWorker',
        code: `const io = new Server(GAME_URL);

registerDrawingGameApplication(io, {
  countdownMs,
});

workerScope.onconnect = ({ ports: [port] }) => {
  if (port) attachSharedWorker(io, port);
};`,
        note: 'The demo uses this browser runtime so three tabs can share one in-memory server.',
      },
    ],
  },
  scenario: {
    intro:
      'Follow the same selected workflow through either runtime, then open the browser demo to try the SharedWorker path.',
    steps: [
      {
        id: 'connect',
        event: 'CONNECT ×3',
        label: 'Open three player tabs',
        experience: 'Player A opens Players B and C. Each page receives a distinct socket ID.',
        exchange: 'Three clients connect to the selected server runtime.',
      },
      {
        id: 'join',
        event: 'JOIN',
        label: 'Join one game session',
        experience: 'The three players appear in the same room and see the same participant state.',
        exchange: 'Each client emits join-session and receives an acknowledgement plus session state.',
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
  observedBehavior: [
    { behavior: 'Three clients connect with distinct socket IDs', socketIo: 'Observed', smocket: 'Observed' },
    { behavior: 'All clients join one room and receive shared state', socketIo: 'Observed', smocket: 'Observed' },
    { behavior: 'A stroke reaches the other two clients, not its sender', socketIo: 'Observed', smocket: 'Observed' },
    { behavior: 'Wrong and correct guesses return acknowledgements', socketIo: 'Observed', smocket: 'Observed' },
    { behavior: 'A correct guess ends the round on all three clients', socketIo: 'Observed', smocket: 'Observed' },
    { behavior: 'Closing a client removes it from the session', socketIo: 'Observed', smocket: 'Observed' },
  ],
  boundaries: [
    {
      label: 'Check with Real Socket.IO',
      title: 'Network and production behavior',
      items: [
        'Transport, authentication, reconnection, and deployment',
        'Persistence and integration with the real backend',
        'Behavior outside Smocket’s documented API surface',
      ],
    },
    {
      label: 'SharedWorker conditions',
      title: 'One browser profile and origin',
      items: [
        'Tabs share the same profile, origin, worker script URL, and worker name',
        'Worker restarts clear its in-memory sockets, rooms, and application state',
        'The automated browser run currently uses desktop Chromium',
      ],
    },
  ],
  source: {
    repository: SMOCKET_REPOSITORY,
    commit: '91a9479416d7d84eaf19119171497cc20098ead6',
    version: '1.0.0',
    date: '2026-08-27',
    command: 'pnpm example:drawing-game:verify',
    note: 'The drawing-game check runs the selected three-client workflow with Smocket and Real Socket.IO.',
    files: [
      'examples/drawing-game/src/game/application.ts',
      'examples/drawing-game/src/game/game-handler.ts',
      'examples/drawing-game/src/real-server.ts',
      'examples/drawing-game/src/shared-worker.ts',
      'examples/drawing-game/verify.mjs',
    ],
  },
  links: [
    { label: 'GitHub', href: SMOCKET_REPOSITORY },
    { label: 'README', href: `${SMOCKET_REPOSITORY}#readme` },
    { label: 'Drawing-game source', href: `${SMOCKET_REPOSITORY}/tree/main/examples/drawing-game` },
    { label: 'Open the 3-tab demo', href: '/demo/multi' },
  ],
} as const;

export type RuntimeId = (typeof report.runtimes)[number]['id'];
export type ScenarioStepId = (typeof report.scenario.steps)[number]['id'];
