export const PINNED_SOURCE_COMMIT = 'fa90e07e272c7fd0db64ebfd73cbb104664ddb81';
export const OBSERVATION_SHA256 =
  '414b07fb27b70cc836d8b71d78d63a0f530d2cae28dbd32b60e77462a64f4bad';

const SMOCKET_ROOT = 'https://github.com/electrohyun/smocket';

export const caseStudyLinks = {
  authoritativeDocument: `${SMOCKET_ROOT}/blob/${PINNED_SOURCE_COMMIT}/docs/application-case-study.md`,
  observation: `${SMOCKET_ROOT}/blob/${PINNED_SOURCE_COMMIT}/case-studies/chat-room/observations.json`,
  source: `${SMOCKET_ROOT}/tree/${PINNED_SOURCE_COMMIT}/case-studies/chat-room`,
} as const;

export const caseStudyCopy = {
  hero: {
    eyebrow: 'Application case study',
    title: 'Same observable result. Different test support.',
    lead:
      'Real Socket.IO, exact published Smocket, and a handwritten mock ran one moderated chat-room workflow against the same application, scenario, and assertions.',
    authority:
      'The static Markdown document is the authoritative interpretation. This page is an interactive form of the same pinned observation data.',
  },
  approaches: {
    title: 'Three approaches, one application.',
    lead:
      'Only dependency wiring and bootstrap differ. The handwritten fixture additionally owns the mock implementation being compared.',
    ownership: {
      'socket-io':
        'Owns an HTTP server, an ephemeral loopback port, server shutdown, and client activation options. It is the behavioral reference and the only target that runs this workflow through a transport.',
      'published-smocket':
        'Owns one exact package dependency and an in-memory bootstrap. The shared application and assertion code are unchanged.',
      handwritten:
        'Owns an in-memory mock for the exercised socket, room, event, acknowledgement, broadcast, and disconnect behavior. It has no package dependency and needs no port.',
    },
  },
  result: {
    title: 'One shared observable record.',
    lead:
      'Every target produced these transcript lines and structured values. No behavioral disagreement appeared, and the shared application, workflow, and assertions required no target branch.',
  },
  evidence: {
    title: 'Three lenses, three evidence boundaries.',
    lenses: [
      {
        title: 'Fidelity',
        body: 'Published Smocket did not change the selected application\'s observable result relative to real Socket.IO. This says nothing about behavior outside the shared assertions; the conformance report remains authoritative for declared compatibility.',
      },
      {
        title: 'Reliability',
        body: 'The runner is repeatable and each recorded target passed twice in one process. This is one snapshot, not evidence of continued success over time. Recurring published-package validation is separate integration evidence.',
      },
      {
        title: 'Productivity',
        body: 'Physical source lines, including blank and comment lines, describe concrete code surfaces. They are not a productivity score, and generated lockfiles are excluded from that comparison.',
      },
    ],
  },
  ownership: {
    title: 'What the targets own.',
    neutralFindings: [
      'The handwritten target is simpler in dependency installation and port setup.',
      'The real target supplies reference behavior without application-owned mock logic.',
      'Published Smocket keeps the shared application and assertions unchanged with an in-memory bootstrap.',
    ],
    inference:
      'Inference, not a measured future result: changes to the exercised event or room semantics may require maintaining the handwritten mock\'s additional implementation surface.',
  },
  limitations: {
    title: 'Read this result at its actual size.',
    items: [
      'The selected scenario is one moderated, two-room workflow, not a representative sample of every Socket.IO application.',
      'The snapshot covers only the recorded package versions, machine, and runtime.',
      'The real target uses a local HTTP server while the other two are in memory. This is not a transport comparison.',
      'The handwritten boundary reflects the implementation author judgment; another application may need a different design.',
      'Equal results must not be generalized beyond the shared assertions, and one recorded run is not historical reliability.',
    ],
  },
} as const;
