const REPO = 'https://github.com/electrohyun/smocket';
const DOCS = `${REPO}/blob/main/docs`;
const DECISIONS = `${DOCS}/decisions`;

export const roadmapLinks = {
  canonical: `${DOCS}/roadmap.md`,
  milestone: `${REPO}/milestone/3`,
  adr0019: `${DECISIONS}/0019-what-counts-as-a-breaking-change.md`,
  scope: `${DOCS}/scope.md`,
  conformance: `${DOCS}/conformance.md`,
  differences: `${DOCS}/differences.md`,
  lenses: `${DOCS}/development-lenses.md`,
  direction: `${REPO}/issues/213`,
  roadmapIssue: `${REPO}/issues/216`,
  caseStudy: `${REPO}/issues/218`,
} as const;

type RoadmapLink = {
  label: string;
  href: string;
};

export type RoadmapDisclosure = {
  id: string;
  title: string;
  summary: string;
  detail: string;
  links: readonly RoadmapLink[];
};

export type ReleaseStage = {
  id: string;
  label: string;
  eyebrow: string;
  summary: string;
  detail?: string;
  conditional?: boolean;
};

export const roadmap = {
  eyebrow: 'Public project direction',
  title: 'Roadmap to v1.0.0',
  summary:
    'A readable map of the guarantee, review gates, dependencies, and release sequence maintained in the smocket repository.',
  sourceNote:
    'The GitHub roadmap owns policy and current status. This page is a presentation of that source, not a second roadmap.',
  guarantee:
    'v1.0.0 aims to provide stable observable behavior and public types within the documented Socket.IO logic-layer subset.',
  stabilizes: [
    'Observable behavior inside the documented logic-layer scope',
    'Public types that applications compile against',
    'Published intentional differences and smocket-only APIs under explicit version rules',
  ],
  nonGoals: [
    {
      id: 'transport',
      title: 'Transport and fallback',
      detail: 'WebSocket, HTTP long-polling, Engine.IO framing, and transport fallback require a real network.',
    },
    {
      id: 'heartbeat',
      title: 'Heartbeat and ping timeout',
      detail: 'An in-memory implementation has no connection to probe for liveness.',
    },
    {
      id: 'reconnection',
      title: 'Real-network reconnection',
      detail: 'A simulation hook may be considered separately, but it would not claim to reproduce a network failure.',
    },
    {
      id: 'multi-server',
      title: 'Multi-server delivery',
      detail: 'Redis adapters, serverSideEmit, and cross-process delivery remain outside a one-process mock.',
    },
    {
      id: 'binary',
      title: 'Binary encoding',
      detail: 'The v1 boundary does not promise binary encoding or Engine.IO wire framing.',
    },
  ],
  reviewSummary:
    'Fidelity and Extensibility review scenarios, observable results, public extension points, and documented divergences before work enters the v1 release gate.',
  classifications: [
    {
      id: 'required',
      title: 'Required for v1',
      summary: 'A confirmed defect inside the guarantee, or a capability explicitly accepted as necessary.',
      detail:
        'Required work must have a concrete issue or decision and belong to the v1.0.0 milestone before it becomes a release gate.',
      links: [{ label: 'Open the v1.0.0 milestone', href: roadmapLinks.milestone }],
    },
    {
      id: 'optional',
      title: 'Optional',
      summary: 'A compatible improvement that does not block existing use.',
      detail:
        'Optional work may ship before v1 when it is small and compatible, but it does not hold the stable release.',
      links: [{ label: 'Read the canonical classification table', href: roadmapLinks.canonical }],
    },
    {
      id: 'post-v1',
      title: 'Post-v1',
      summary: 'Directionally aligned work that is unnecessary for the v1 guarantee.',
      detail:
        'Post-v1 promises another review, not implementation in the next release or a particular version.',
      links: [{ label: 'Read how deferred work is tracked', href: roadmapLinks.canonical }],
    },
    {
      id: 'out-of-scope',
      title: 'Outside scope',
      summary: 'Behavior outside the documented logic-layer boundary.',
      detail:
        'Outside-scope findings become explicit non-goals rather than unplanned implementation promises.',
      links: [{ label: 'Read the documented scope', href: roadmapLinks.scope }],
    },
  ] satisfies readonly RoadmapDisclosure[],
  releaseStages: [
    {
      id: 'v0.4.2',
      label: 'v0.4.2',
      eyebrow: 'Published baseline',
      summary: 'The starting line recorded by the canonical roadmap.',
    },
    {
      id: 'review',
      label: 'Fidelity & Extensibility review',
      eyebrow: 'Review',
      summary: 'Review scenarios, observable results, extension points, and divergences.',
    },
    {
      id: 'classify',
      label: 'Classify findings',
      eyebrow: 'Decision gate',
      summary: 'Route each finding to required, optional, post-v1, or outside scope.',
    },
    {
      id: 'v0.4.3',
      label: 'v0.4.3',
      eyebrow: 'Pre-v1 patch line',
      summary: 'Ship changes that ADR 0019 classifies as a pre-v1 patch.',
      detail:
        'Measured conformance corrections, newly covered Socket.IO surface, compatible improvements, documentation, refactoring, and maintenance may share this release when reviewed together.',
    },
    {
      id: 'v0.5.0',
      label: 'Conditional v0.5.0',
      eyebrow: 'Only if required',
      summary: 'Use a pre-v1 minor only when required work falls into an ADR 0019 major-class row.',
      detail:
        'If no required pre-v1 change needs that classification, the path to v1.0.0 does not need to pass through v0.5.0.',
      conditional: true,
    },
    {
      id: 'stabilization',
      label: 'Stabilization',
      eyebrow: 'Last pre-v1 line',
      summary: 'Keep the final pre-v1 line to corrections, documentation, and compatible small improvements.',
      detail:
        'The roadmap does not lock intermediate version numbers or a release count in advance.',
    },
    {
      id: 'v1.0.0',
      label: 'v1.0.0',
      eyebrow: 'Stable release',
      summary: 'Publish the documented logic-layer guarantee and public types as stable promises.',
    },
  ] satisfies readonly ReleaseStage[],
  dependencies: [
    {
      id: 'application-validation',
      title: 'Application validation',
      summary: 'A maintained workflow and independent package boundary feed the published application case study.',
      detail:
        'The workflow, consumer installation boundary, and published comparison serve different responsibilities and remain linked rather than collapsed into one gate.',
      links: [
        { label: 'Application workflow #113', href: `${REPO}/issues/113` },
        { label: 'Published-package boundary #208', href: `${REPO}/issues/208` },
        { label: 'Application case study #218', href: roadmapLinks.caseStudy },
      ],
    },
    {
      id: 'package-boundaries',
      title: 'Package boundaries',
      summary: 'Server and client responsibilities must be assigned before the public API guarantee is finalized.',
      detail:
        'Decisions 0022 and 0023 establish root socket names and the thin smocket-client facade that must ship before v1.',
      links: [
        {
          label: 'Decision 0022',
          href: `${DECISIONS}/0022-root-socket-names-server-socket.md`,
        },
        {
          label: 'Decision 0023',
          href: `${DECISIONS}/0023-client-package-is-a-thin-facade.md`,
        },
      ],
    },
    {
      id: 'payload-lifecycle',
      title: 'Payload and lifecycle boundaries',
      summary: 'The JSON snapshot boundary and Manager-level disconnect behavior affect release order.',
      detail:
        'Decisions 0026 and 0028 define the behavior; issues #250 and #254 implement it before the v1 guarantee is final.',
      links: [
        {
          label: 'Decision 0026',
          href: `${DECISIONS}/0026-payloads-cross-a-json-snapshot-boundary.md`,
        },
        { label: 'Payload implementation #250', href: `${REPO}/issues/250` },
        {
          label: 'Decision 0028',
          href: `${DECISIONS}/0028-disconnect-true-closes-the-shared-manager-group.md`,
        },
        { label: 'Manager lifecycle #254', href: `${REPO}/issues/254` },
      ],
    },
    {
      id: 'adapter-boundary',
      title: 'Adapter boundary is not a release dependency',
      summary: 'Built-in Adapter compatibility stays at rooms unless a concrete use case changes the decision.',
      detail:
        'Decision 0025 keeps deferred Adapter methods and lifecycle events out of the v1 implementation gate by default.',
      links: [
        {
          label: 'Decision 0025',
          href: `${DECISIONS}/0025-built-in-adapter-observation-stays-rooms-only.md`,
        },
      ],
    },
    {
      id: 'review-guidance',
      title: 'Review guidance',
      summary: 'The five development lenses and direction discussion guide trade-offs and new use cases.',
      detail:
        'The lenses are decision tools rather than a second issue taxonomy, while #213 remains the parent discussion for roadmap feedback.',
      links: [
        { label: 'Development lenses', href: roadmapLinks.lenses },
        { label: 'Direction discussion #213', href: roadmapLinks.direction },
      ],
    },
  ] satisfies readonly RoadmapDisclosure[],
  changeSteps: [
    'Record the reason in a concrete issue or decision record.',
    'Classify it as required, optional, post-v1, or outside scope.',
    'Check the target release and material dependencies.',
    'Update the milestone and canonical roadmap together.',
  ],
  relatedLinks: [
    { label: 'Canonical roadmap', href: roadmapLinks.canonical },
    { label: 'v1.0.0 milestone', href: roadmapLinks.milestone },
    { label: 'ADR 0019 · version compatibility', href: roadmapLinks.adr0019 },
    { label: 'Documented scope', href: roadmapLinks.scope },
    { label: 'Conformance report', href: roadmapLinks.conformance },
    { label: 'Roadmap issue #216', href: roadmapLinks.roadmapIssue },
    { label: 'Direction discussion #213', href: roadmapLinks.direction },
  ],
} as const;
