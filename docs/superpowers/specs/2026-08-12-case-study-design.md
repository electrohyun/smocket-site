# Interactive application case study design

## Purpose

Add an English `/case-study` page to `smocket-site` that presents the recorded
moderated chat-room comparison from `electrohyun/smocket#218` as an interactive
form. The static Markdown case study remains the authoritative interpretation;
the site must preserve its observations, evidence boundaries, qualifications,
and limitations without adding conclusions or marketing metrics.

The page compares Real Socket.IO 4.8.3, exact published Smocket 0.4.2, and a
handwritten mock. It must state that all three produced the same observable
result for the selected workflow, while making clear that this is neither an
overall Socket.IO compatibility proof nor a transport comparison.

## Source and reproducibility

Vendor the exact bytes of `case-studies/chat-room/observations.json` from Smocket
commit `fa90e07e272c7fd0db64ebfd73cbb104664ddb81`. Vendoring is preferred to a
build-time fetch because the existing site build has no network preparation
step, and a checked-in artifact makes local builds and previews deterministic.

The expected observation SHA-256 is
`414b07fb27b70cc836d8b71d78d63a0f530d2cae28dbd32b60e77462a64f4bad`.
The expected combined application-source SHA-256 recorded inside the artifact
is `e3884c42af5987b4db154c7f13538054e405e12b496803b8d321ac9a409b62d5`.

A repository script must validate the vendored file before production builds.
It will check:

- the exact file SHA-256;
- schema version 1 and case-study identifier `moderated-chat-room`;
- the required environment, reproduction, application, target, result,
  observation, and claim-boundary shapes;
- the recorded combined application-source hash;
- the exact three target identifiers;
- passed assertions and matching repeated runs for each target; and
- deep equality of all three structured observations.

The validator must be reusable from Vitest. A `prebuild` script will run it so a
hash or schema mismatch prevents deployment rather than rendering potentially
misleading evidence. The page performs no runtime request to GitHub or `main`.

## Information architecture

The page follows the landing page's established cream/night space palette,
JetBrains Mono details, bordered cards, code surfaces, global spacing, theme
toggle, footer, and responsive breakpoints. It consists of these sections:

1. **Hero and boundary.** Introduce “one workflow, three approaches, the same
   observable result.” State prominently that the static Markdown document is
   authoritative and this page is an interactive expression of its pinned
   observation data. Link to the static document and source record.
2. **Approach comparison.** Show three target cards derived from the JSON:
   exact dependencies, bootstrap source lines, additional authored mock source,
   assertion outcome, and repeat-match result. Accompany these facts with the
   static document's target-ownership explanations: only the real target uses
   a local HTTP transport; the published package uses an in-memory bootstrap;
   the handwritten target has no dependency or port but owns its mock.
3. **Shared observable result.** Present one shared transcript rather than
   repeating identical copies per target. A target selector demonstrates that
   each target maps to the same record and keeps the selected target's label
   visible. Participant and observation-category filters make the ten transcript
   lines understandable without changing their order or wording.
4. **Structured observation explorer.** Let readers switch among joins,
   welcomes, room message, authorization, multi-room announcement, and departure.
   Each view is rendered from the canonical observation object and describes
   recipients, acknowledgements, non-receipt, or rejection explicitly.
5. **Evidence lenses.** Give Fidelity, Reliability, and Productivity separate
   cards. Each repeats the static document's boundary: selected-workflow
   agreement only; one repeatable snapshot rather than historical reliability;
   and descriptive source surfaces rather than a productivity score.
6. **Owned surfaces.** Compare dependency installation, bootstrap, server/port
   ownership, and authored source. Preserve neutral or unfavorable findings:
   the handwritten target has simpler dependency and port setup, while the real
   target supplies reference behavior without application-owned mock logic.
   Any future-maintenance statement is explicitly labeled an inference.
7. **Limitations.** Retain scenario selection, recorded-version and environment
   constraints, handwritten-boundary author judgment, absence of transport
   comparison, and limits on generalization and historical reliability.
8. **Reproduce and provenance.** Derive commands, environment, source revision,
   target versions, recorded timestamp, file hashes, observation hash, and
   combined application hash from the validated data plus the one pinned source
   constant. Provide copy controls for commands and hashes where useful.

Add a `Case study` link to the landing footer and `/case-study` to the sitemap.
The case-study route uses the shared footer and theme toggle, while leaving the
landing-only reading progress indicator on the landing page.

## Components and data flow

Keep the route's content and behavior locally bounded under `app/case-study/`.
The server page loads the vendored JSON through a typed data module and derives
the presentation model. Static interpretation copy lives in a dedicated content
module rather than JSX. Numeric values, versions, dependencies, commands,
transcript lines, structured events, environment fields, and hashes come from
the validated artifact wherever they exist.

A focused client explorer receives serializable target summaries and the common
observation. It owns only user selection state:

- selected target;
- participant filter; and
- structured observation category.

The initial server-rendered state shows the complete transcript and the first
target, so the evidence remains readable without client-side interaction.
Target selection must not imply behavioral differences: the UI explicitly says
the displayed observation is shared and changes only the inspected approach.

Use native buttons with `aria-pressed` or a native tab pattern where appropriate,
visible focus indicators, named regions, semantic tables/lists, and an announced
empty-filter state. Do not auto-play a timeline. Transitions are small surface
or color changes and are removed under `prefers-reduced-motion`.

## Responsive behavior

At desktop widths, the three approach cards and evidence lenses use three-column
grids, while the observation explorer can place controls beside the transcript.
At tablet and mobile widths, all comparisons become single-column reading order,
wide factual tables become stacked definition lists or horizontally scrollable
regions with labels, and filter controls wrap without shrinking below accessible
touch targets. Long commands and hashes wrap or scroll within their own code
surface without widening the page.

The page must be visually checked at a desktop viewport and at 375 px, in light
and dark themes. Keyboard focus order and reduced-motion rendering must also be
checked in a real browser.

## Failure handling

Invalid or changed evidence is a build failure. The validator reports which
contract failed without logging or rewriting the artifact. There is no runtime
fallback to unverified data and no network retry path.

An interactive filter with no matching transcript lines shows a plain empty
message and a control to return to all participants. Since the underlying data
is static and already validated, the client does not need loading or network
error states.

## Testing and verification

Use test-driven implementation for the feature. Add tests for:

- successful validation of the vendored artifact;
- rejection of a wrong file hash, schema version, application hash, missing
  required fields, unexpected targets, failed assertions, or unequal results;
- derivation of dependency labels, authored code surfaces, common transcript,
  filters, and structured observation categories from the artifact;
- page-level presence of the authoritative-document notice, all three targets,
  evidence lenses, limitations, provenance, and reproduction commands; and
- core target, participant, and category interactions in the smallest practical
  DOM test setup supported by the repository.

Run all repository-required checks: `pnpm lint`, `pnpm typecheck`, `pnpm test`,
and `pnpm build`. Then inspect `/case-study` in a real browser at desktop and
mobile sizes, including keyboard, reduced motion, and both themes.

## Git and delivery

Keep changes scoped to the case study and its discoverability. Use Conventional
Commits split by meaning: the design specification, the data/validation contract,
the interactive page, and any final verification or metadata adjustment when it
stands independently. Do not modify the Smocket repository.

Open a pull request against `main` whose body uses
`Refs electrohyun/smocket#218`, never `Closes`. Report the pinned source commit,
both verified hashes, all verification results, the PR URL, and the preview or
deployment URL. Issue #218 remains open because deployment confirmation and the
follow-up update to Smocket #213 are outside this repository change.
