# Comparison-first application case study design

## Purpose and correction

Build `/case-study` as an interactive technical report answering the research
question in `electrohyun/smocket#218`: for one selected application workflow,
what setup, test-support code, mock behavior, workarounds, debugging paths, and
maintenance surfaces does each approach require?

The first implementation made the shared transcript its dominant interaction.
That interaction did not explain how Real Socket.IO, exact published Smocket,
and the handwritten mock differ. This revision makes owned test-support surface
and implementation evidence the page's main subject. The common observation is
still essential, but it becomes the behavioral baseline against which the three
approaches are compared.

The report must not rank the approaches, convert source lines into a
productivity score, imply a transport comparison, claim historical reliability,
or extend the result beyond this workflow. The static Markdown case study
remains the authoritative interpretation.

## Immutable evidence and two source revisions

Two immutable Smocket revisions serve different purposes and must not be
conflated:

- Observation and compared source revision:
  `fa90e07e272c7fd0db64ebfd73cbb104664ddb81`.
- Authoritative Markdown publication revision:
  `6a17477beef33fb014ab629b914d80a6f144b31b`.

The observation JSON remains vendored byte-for-byte and must retain SHA-256
`414b07fb27b70cc836d8b71d78d63a0f530d2cae28dbd32b60e77462a64f4bad`.
The combined shared application source hash remains
`e3884c42af5987b4db154c7f13538054e405e12b496803b8d321ac9a409b62d5`.

Vendor these exact compared source files from the observation revision:

- shared `examples/chat-room/app.js`, `scenario.js`, and `assertions.js`;
- Real Socket.IO `bootstrap.js`;
- published Smocket `bootstrap.js`;
- handwritten `bootstrap.js` and `handwritten-socket-io.js`.

The build validator must verify every vendored source file against the
corresponding per-file SHA-256 recorded in `observations.json`. Source excerpts
must be derived from these vendored files, never copied into JSX or fetched at
runtime. Direct links must use the same immutable revision. The authoritative
Markdown link alone uses its publication revision.

The existing semantic validation remains: schema version, case-study ID,
application hash, exact targets, passing assertions, repeat matches, and equal
structured observations. Any mismatch is a build failure.

## Report hierarchy

### Report header and abstract

Use a compact document header rather than a marketing hero. It contains:

- `Chat-room application case study` as the title;
- a one-paragraph abstract stating that observable behavior matched while owned
  test-support surfaces differed;
- recorded date, environment, three exact dependency versions, and report
  status;
- a prominent authoritative-document link using the verified publication
  revision; and
- the claim boundary from the observation JSON.

Do not use a giant display headline, decorative orbit, or a viewport-height
hero. The report body must begin within the initial desktop viewport.

### 1. Research question and method

Explain that all targets use the same application, scenario, and assertions,
and that only dependency wiring and target bootstrap differ; the handwritten
fixture additionally owns the compared mock implementation. Show the three
shared files with their roles, physical line counts, hashes, and pinned links.

State that listeners register before actions and acknowledgements plus later
per-socket markers establish completion/non-receipt without delays or timeouts.
State that the runner executes the same assertions twice per target.

### 2. Authored surface comparison

This is the report's primary visualization. Show the exact authored target
surface as contextual stacked bars on one shared scale:

- Real Socket.IO: 61 bootstrap lines;
- exact published Smocket: 28 bootstrap lines;
- handwritten: 28 bootstrap lines plus 212 mock-implementation lines.

Every bar includes exact numbers and segment labels in text; width alone never
carries meaning. Explain immediately that these are physical source lines,
including blank and comment lines, observed for this workflow. They are not a
productivity score, generated lockfiles are excluded from authored-source
comparison, and the counts cannot be generalized.

Below the visualization, use one comparison table with rows for:

- exact dependencies and clean-install inputs;
- bootstrap/runtime setup;
- HTTP server and ephemeral port ownership;
- client activation and shutdown ownership;
- authored fixture files;
- application-owned mock implementation;
- shared application/assertion changes or branches;
- explicit target-owned failure/debugging paths visible in the pinned source;
- locations that change when target wiring or exercised semantics change; and
- directly observed simpler aspects for each target.

The table preserves neutral and unfavorable findings. The handwritten target is
simpler in dependency installation and port setup. The Real target provides
reference behavior without application-owned mock logic. Smocket avoids server
and port setup while retaining a package dependency. Statements about possible
future handwritten maintenance are labeled `Inference` and tied to the observed
212-line owned implementation.

Do not invent encountered failures. If the record contains no observed
target-specific workaround, say so: the shared application, scenario, and
assertions contain no target branch or workaround; integration differences are
isolated in fixture wiring and bootstrap. Distinguish that observation from
explicit error paths present in target-owned source.

### 3. Pinned implementation evidence

Provide an approach selector that changes actual comparison evidence, not just a
label. Selecting Real, Smocket, or handwritten shows:

- dependency/setup summary;
- owned file list and per-file responsibility;
- the actual pinned bootstrap excerpt;
- explicit setup/debugging paths present in that source;
- a pinned direct-source link; and
- for handwritten, a second selectable excerpt from the mock implementation.

The handwritten mock view maps required behaviors to concrete source regions:

- room membership maps and joins;
- union routing across rooms;
- sender exclusion;
- acknowledgements;
- disconnect notification and cleanup.

It also lists deliberately omitted behavior from the authoritative report:
namespaces, middleware, reconnection, transport behavior, and all other
unexercised Socket.IO APIs. Supported and omitted behaviors must be visually and
semantically distinct.

Source code is evidence, not decoration. Excerpts have a file name, line range,
responsibility caption, horizontally scrollable code surface, and immutable
source link. Excerpt line ranges are centrally defined and tested against the
vendored source.

### 4. Workflow behavior matrix

Show rows for acknowledged joins, private welcomes, room message delivery,
authorization rejection, multi-room union announcement, and disconnect
notification. Columns show Real, Smocket, and handwritten. Every cell reports
`Passed · same observation`; the matrix caption limits that statement to the
shared assertion.

Selecting a row opens evidence specific to that behavior:

- expected structured value derived from `observations.json`;
- the relevant assertion or scenario excerpt;
- the shared application implementation excerpt; and
- handwritten implementation evidence only where the behavior is modeled
  there.

This is the principal behavioral interaction. It connects equal observable
results to the code and assertions that establish them while making clear that
all targets share application and assertion code without a target branch.

### 5. Supporting transcript evidence

Move the transcript below the comparison and matrix. Present it in a collapsed
native `details` region titled `Supporting evidence: shared transcript`.
Participant and event filters may remain inside, but there is no target selector
because target selection cannot change the identical transcript. The full
canonical order is available when expanded.

### 6. Interpretation and limitations

Present Fidelity, Reliability, and Productivity as report subsections rather
than feature cards:

- Fidelity: agreement only within the selected assertions; the conformance
  report remains authoritative for declared compatibility.
- Reliability: one repeatable snapshot with two matching executions in one
  process; not continued evidence over time.
- Productivity: observed setup and authored surfaces, not a score.

Keep all limitations: one moderated two-room scenario, exact recorded versions
and environment, author judgment in handwritten scope, no transport comparison,
no generalization, and no historical reliability claim.

### 7. Reproduction and provenance

Keep all recorded commands, environment, observation and application hashes,
the compared source revision, and direct source links. Show the authoritative
publication revision separately so readers understand why it differs from the
observation source revision.

## Visual language and responsive behavior

Reuse the site's design tokens, typography, theme toggle, code surface, footer,
and star field only as a quiet page background. The report itself uses a bounded
document surface, restrained type scale, numbered headings, tables, rules, and
figure captions. Decorative elements must not displace evidence.

Desktop uses a compact report header, optional sticky section navigation, and a
reading column wide enough for comparison tables (approximately 1040px outer,
760–820px prose). At 375px, navigation becomes an inline section list, tables
use labeled stacked rows or controlled horizontal scrolling, bars retain exact
labels, and code scrolls within its own region. There must be no page-level
horizontal overflow.

All controls use native buttons or disclosure elements, 44px minimum targets,
visible focus, correct `aria-pressed` state, and meaningful accessible names.
Color never carries pass/support/omit state alone. Motion is limited to small
state transitions and removed with `prefers-reduced-motion`.

## Testing and visual verification

Retain validator, model, static report, lint, typecheck, full test, and build
coverage. Add a DOM-capable test environment with React Testing Library and
user-event for actual interaction tests:

- clicking and keyboard-activating approach selectors changes file/code/setup
  evidence;
- clicking and keyboard-activating matrix rows changes assertion/application/
  implementation evidence;
- disclosure and transcript filters work in the DOM;
- focus order reaches navigation, selectors, matrix, disclosure, and source
  links; and
- selected/expanded states expose correct accessibility attributes.

Run real-browser visual QA on the deployed or local page at desktop and 375px,
in light and dark themes, and with reduced motion. Capture screenshots and
record the checked viewport/theme combinations. A protected preview or missing
browser connection does not satisfy this condition; do not claim completion
until the page itself has been visually inspected.

## Requirements traceability self-review

| #218 requirement | Report location |
| --- | --- |
| Installation, dependency, setup, and configuration | Authored surface table; implementation evidence |
| Server bootstrap and test-support code | Stacked bars; comparison table; pinned excerpts |
| Application and assertion code shared without branches | Method file table; matrix evidence |
| Mock-specific implementation code | Handwritten source view and behavior map |
| Reproduced and omitted behavior | Handwritten supported/omitted lists; behavior matrix |
| Workarounds and target-specific branches | Method and comparison table: none in shared code; wiring isolated in bootstrap |
| Files or locations changed as workflow changes | Owned file/responsibility and change-location rows |
| Failure/debugging surfaces | Explicit source error-path row and source evidence, without claiming encountered failures |
| Cases where an approach is simpler | Neutral findings in comparison table and interpretation |
| Fidelity | Behavior matrix and interpretation boundary |
| Reliability | Recorded repeat result and single-snapshot boundary |
| Productivity | Contextual authored surface and non-score boundary |
| Transcript and structured observation exploration | Behavior matrix first; collapsed supporting transcript second |
| Reproduction, environment, commit, hashes | Final provenance section |
| Limitations and unfavorable findings | Interpretation/limitations and comparison table |

Self-review result: the new hierarchy answers the research question before
showing the shared transcript; every primary interaction changes comparison or
implementation evidence; each quantitative surface is contextualized; and no
section adds an unsupported ranking, metric, or compatibility conclusion.

## Delivery

Update the existing PR rather than opening a replacement. Keep commits split by
meaning: revised design/plan, pinned source contract, comparison report, DOM
interaction tests, and QA corrections. Preserve unrelated changes from the
current remote `main`. The PR continues to use
`Refs electrohyun/smocket#218`, never `Closes`.
