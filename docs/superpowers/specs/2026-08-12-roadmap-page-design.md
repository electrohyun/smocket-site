# Public v1.0.0 roadmap page design

## Purpose

Add `/roadmap` as a public, reading-first presentation of the roadmap maintained
in `electrohyun/smocket`. The page helps a visitor understand what v1.0.0 aims
to guarantee, how findings are classified, how the pre-v1 releases lead to the
stable release, and which dependencies affect that order.

The canonical `docs/roadmap.md`, milestone, issues, and ADRs continue to own
policy, requirements, decisions, and status. The site does not calculate
progress, mirror issue state, or create additional commitments. A prominent
source note links to the canonical roadmap and says it wins if the two forms
ever differ.

## Content source and boundaries

The page presents the current durable statements in the canonical roadmap:

- v1.0.0 aims to stabilize observable behavior and public types within the
  documented Socket.IO logic-layer subset;
- network transport and every Socket.IO API are not promised;
- Fidelity and Extensibility review findings become required, optional,
  post-v1, or explicit non-goals through concrete issues or decisions;
- the planned path is v0.4.3, an optional v0.5.0 when ADR 0019 requires a
  pre-v1 minor, stabilization, then v1.0.0; and
- only dependencies that affect release order belong in the overview.

Copy lives in a typed `content/roadmap.ts` module so page structure and tests
share one source. Links point directly to the canonical roadmap, milestone,
scope and conformance documents, related issues, and the relevant ADRs. The
page does not fetch GitHub at runtime or expose open/closed counts, percentages,
dates, or inferred schedules.

## Page hierarchy

### Header

Use a compact editorial header inside the site's bounded document surface, not
a full-height marketing hero. It contains the smocket wordmark, `Roadmap to
v1.0.0`, a short summary, and a clear link to the canonical roadmap. A short
source note states that GitHub owns policy and current status.

### 1. The v1 guarantee

Present the intended guarantee in one concise statement, followed by two
balanced lists:

- what v1 aims to stabilize; and
- explicit non-goals such as transport fallback, heartbeat, real-network
  reconnection, multi-server delivery, and binary framing.

The non-goals are framed as boundaries of an in-memory implementation, not
missing progress items.

### 2. Review and classification

Explain that Fidelity and Extensibility review scenarios, observable results,
public extension points, and documented divergences. Show four outcome groups:

- required for v1;
- optional;
- post-v1; and
- outside scope.

Each outcome is a native `details` disclosure. Its summary gives the outcome in
one line, while the expanded copy explains the governing condition and links to
the canonical location. All four summaries remain readable without expansion.

### 3. Pre-v1 release flow

Make the release sequence the primary visual. A responsive CSS flow shows:

`v0.4.2 → review → classify → v0.4.3 → conditional v0.5.0 → stabilization →
v1.0.0`.

The conditional branch is explicitly labeled and never implies that v0.5.0 is
scheduled. Exact labels accompany every node and connector so color and shape
are not the only carriers of meaning. On mobile the flow becomes a vertical
sequence with the conditional branch nested in reading order.

The `v0.4.3`, conditional `v0.5.0`, and stabilization nodes use native
disclosures for short release-policy explanations. This adds quiet interaction
without making interaction necessary to understand the sequence.

### 4. Release-order dependencies

Group the dependencies by responsibility instead of current completion state:

- application validation (`#113`, `#208`, and the completed case study);
- package boundaries (Decisions 0022 and 0023);
- payload and lifecycle decisions (Decision 0026 with `#250`, Decision 0028
  with `#254`); and
- review guidance (development lenses and `#213`).

Each group is a disclosure with direct links. Decision 0025 is shown as a
non-dependency: deferred Adapter methods do not enter v1 without a concrete use
case. No status badges are rendered.

### 5. How the roadmap changes

End with the four-step change process from the canonical document: record the
reason, classify it, check release/dependencies, and update the milestone and
roadmap together. Provide clear links to the roadmap, milestone, ADR 0019,
scope, conformance report, issue #216, and direction discussion #213.

## Navigation and visual language

Reuse the site's global cream/violet themes, mono accents, theme toggle, footer,
star field, borders, and panel shadows. The page uses a restrained report
surface similar to `/case-study`, but its main visual identity is the release
flow: small numbered nodes, solid required path, and a dashed conditional
branch. It does not reuse case-study-specific comparison components.

A compact section navigation links to guarantee, classification, sequence,
dependencies, and source links. Add `Roadmap` to the shared footer and `/roadmap`
to the sitemap. Leave the landing page and `/demo` unchanged otherwise.

At 375px, the report keeps eight-pixel outer gutters, disclosures remain at
least 44px high, the release flow stacks vertically, and no element creates
page-level horizontal overflow. Desktop keeps the report within approximately
1120px and prose within readable line lengths.

## Accessibility and motion

Use semantic headings, ordered lists, `nav`, `figure`, `figcaption`, and native
`details`/`summary`. Disclosure summaries have visible focus states and include
their condition in text. Links describe their destination rather than saying
only “learn more.” Decorative connectors are hidden from assistive technology.

Transitions are limited to color and small disclosure markers. Under
`prefers-reduced-motion: reduce`, the report transitions and shared star-field
animation stop. The page must work in light and dark themes and remain fully
usable with keyboard navigation.

## Testing and checks

Use test-first development for each behavior:

- a typed content-model test checks the guarantee, non-goals, classification
  outcomes, release order, conditional v0.5.0 wording, dependency links, and
  absence of progress fields;
- a static render test checks the hierarchy, canonical-source notice,
  responsive flow semantics, metadata, footer entry, and sitemap entry;
- a DOM test opens classification, release, and dependency disclosures with
  pointer and keyboard input and verifies focus remains on the activated
  summary; and
- existing tests ensure the landing, demo, and case study remain unchanged.

Run lint, typecheck, the complete test suite, and the production build. Visually
inspect `/roadmap` in a real browser at desktop and 375px in light and dark
themes, test keyboard focus and disclosures, confirm no horizontal overflow,
and confirm the reduced-motion rule is active.

## Issue #2 coverage

| Requirement | Page location |
| --- | --- |
| v1.0.0 intended guarantee | The v1 guarantee |
| Fidelity and Extensibility review | Review and classification |
| Required, optional, post-v1, out-of-scope classification | Four outcome disclosures |
| Planned pre-v1 release sequence | Responsive release flow |
| Material release dependencies | Release-order dependencies |
| Non-goals and deferred work | Guarantee boundary and dependency notes |
| Canonical roadmap, milestone, issues, and ADR links | Source note, each section, final link group |
| Navigation entry | Shared footer |
| Desktop and mobile clarity | Responsive report and vertical mobile flow |
| No CMS, tracker, backend, or API change | Typed static content and server-rendered page only |

Self-review result: the design has no progress calculation or duplicate status
source, the conditional release is not presented as scheduled, every interaction
is optional to comprehension, and no unrelated landing or demo behavior changes.

## Revision: a continuous vertical roadmap journey

The first implementation compressed the seven release stages into one desktop
row and placed the five subjects in adjacent report sections. It was accurate,
but it read as a short summary dashboard rather than a roadmap. The revision
keeps every source boundary above while changing the page's spatial argument:
the reader now travels through one long, connected route.

### Continuous route

The route begins below the canonical-source notice and continues through the
guarantee, classification, release sequence, dependencies, and change process.
Every major section is a named stop on the same vertical rail. Section borders
no longer end one subject before the next; generous approach/departure spacing,
numbered nodes, and a continuous line make the relationship visible.

On desktop the rail sits in a dedicated left gutter and the content opens to
its right. The seven release stages form the route's most detailed passage:
large alternating cards sit beside a central line, with each stage's purpose,
governing rule, and next decision readable without opening anything. The
conditional v0.5.0 card uses a dashed branch and rejoins stabilization. On
mobile all cards align to a left rail in document order.

### Distributed information density

Do not pad the page with invented copy. Distribute the canonical roadmap's
existing information across more legible stops:

- the guarantee stop names the documents that own scope, measured behavior,
  intentional differences, and version judgments;
- each classification outcome gets its own full-width stop rather than sharing
  a 2x2 dashboard;
- each release stage shows its summary plus a plain-text `Next` route label;
- release-rule details remain disclosures, now inside cards with enough room to
  read them; and
- dependency groups become a vertical chain, including the Adapter
  non-dependency as an explicit side branch.

No issue count, date, completion state, percent, or inferred schedule is added.
The only percentage on the page is the reader's private position through the
document, exposed accessibly as reading progress and never described as project
progress.

### Subtle interaction

Add an integrated journey navigator rather than a floating decorative widget.
It contains links to the five major stops, marks the current stop with
`aria-current="step"`, and fills the route line according to document scroll.
The interaction has three jobs only: show reading position, identify the current
subject, and provide keyboard-accessible jumps. It does not alter roadmap data.

Native disclosures remain for classification, release-rule, and dependency
detail. Hover and focus bring the nearby route node forward; opening a detail
visually connects its panel to the rail. Reduced motion removes progress and
marker transitions while preserving all position and state information.

### Revised responsive behavior

The desktop page is intentionally taller: release stages are no longer forced
into 130px columns, prose retains readable measures, and each major stop has
space before the next. At 375px the rail occupies 28px, the cards use the
remaining width, the journey navigator remains horizontally scrollable without
a visible scrollbar, and no page-level overflow is allowed.

### Revised checks

Add test-first coverage for the ordered route labels, semantic major stops,
reading-position calculation, current-stop navigation, and the conditional
branch/rejoin copy. Repeat real-browser review at desktop and 375px in both
themes, including mid-route screenshots, scrolling, anchor jumps, disclosure
keyboard behavior, focus visibility, reduced-motion CSS, and horizontal
overflow.

Revision self-review: the longer page comes from readable structure and
canonical detail rather than repetition; the path remains understandable with
JavaScript and motion disabled; the conditional branch still does not promise
v0.5.0; and the site remains a presentation of the GitHub roadmap.
