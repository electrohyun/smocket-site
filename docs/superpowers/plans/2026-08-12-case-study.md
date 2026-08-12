# Interactive Case Study Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a responsive, accessible `/case-study` explorer backed by the pinned and hash-verified Smocket chat-room observation record.

**Architecture:** Vendor the exact observation JSON and enforce its byte hash and semantic contract with a Node validator before every production build. A typed pure model derives all numeric facts, target summaries, transcript filters, and structured categories for a mostly server-rendered route; one focused client component owns only target, participant, and category selection state.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, CSS Modules, Node `crypto`, Vitest 4, existing site design tokens.

---

## File map

- Create `content/case-study-observations.json`: exact vendored bytes from the pinned Smocket commit.
- Create `scripts/validate-case-study-observations.mjs`: reusable byte-hash and schema/semantic validator plus CLI entry point.
- Create `scripts/__tests__/validate-case-study-observations.test.mjs`: validator contract tests.
- Modify `package.json`: run the validator through `case-study:validate` and `prebuild`.
- Create `content/case-study.ts`: pinned source constants and authoritative static interpretation copy only.
- Create `app/case-study/lib/model.ts`: observation types and pure presentation derivation/filter functions.
- Create `app/case-study/lib/__tests__/model.test.ts`: model and transcript-filter tests.
- Create `app/case-study/components/ApproachComparison.tsx`: target dependency and owned-source comparison.
- Create `app/case-study/components/ObservationExplorer.tsx`: the only client component; target, participant, and category controls.
- Create `app/case-study/components/ObservationExplorer.module.css`: accessible explorer layout and control states.
- Create `app/case-study/components/EvidenceBoundaries.tsx`: Fidelity, Reliability, Productivity, neutral findings, and limitations.
- Create `app/case-study/components/Provenance.tsx`: reproduction commands, environment, source revision, and hashes.
- Create `app/case-study/page.tsx`: route composition and page metadata content.
- Create `app/case-study/layout.tsx`: route metadata and canonical URL.
- Create `app/case-study/page.module.css`: page-wide established visual language and responsive layout.
- Create `app/case-study/__tests__/page.test.tsx`: static render coverage for required claims and evidence.
- Modify `content/landing.ts`: add the footer case-study link.
- Modify `app/sitemap.ts`: add `/case-study`.

### Task 1: Pin and validate the observation artifact

**Files:**
- Create: `content/case-study-observations.json`
- Create: `scripts/validate-case-study-observations.mjs`
- Create: `scripts/__tests__/validate-case-study-observations.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Vendor the source bytes and confirm the supplied hash**

Fetch only the immutable URL below into a temporary file, verify it, then add the exact bytes with `apply_patch`:

```text
https://raw.githubusercontent.com/electrohyun/smocket/fa90e07e272c7fd0db64ebfd73cbb104664ddb81/case-studies/chat-room/observations.json
```

Run:

```powershell
(Get-FileHash -Algorithm SHA256 content\case-study-observations.json).Hash.ToLowerInvariant()
```

Expected: `414b07fb27b70cc836d8b71d78d63a0f530d2cae28dbd32b60e77462a64f4bad`.

- [ ] **Step 2: Write failing validator tests**

Export `validateObservationBytes(bytes, expectedHash)` and assert the canonical file succeeds. Add independent mutation tests for wrong byte hash, `schemaVersion`, `application.combinedSha256`, target IDs, failed assertions, `repeatedRunMatches`, and unequal target observations. Each test must assert a specific error fragment such as `SHA-256`, `schemaVersion`, or `observations differ`.

- [ ] **Step 3: Run validator tests to verify failure**

Run: `pnpm vitest run scripts/__tests__/validate-case-study-observations.test.mjs`

Expected: FAIL because the validator module does not exist.

- [ ] **Step 4: Implement the minimal validator**

Use `createHash('sha256')`, guarded object/array checks, an exact target-ID set, and `isDeepStrictEqual`. Export the two constants below and a `validateObservationBytes(bytes, expectedHash = EXPECTED_OBSERVATION_SHA256)` function that returns the parsed record after every check succeeds and throws a field-specific `Error` on the first failed check:

```js
export const EXPECTED_OBSERVATION_SHA256 = '414b07fb27b70cc836d8b71d78d63a0f530d2cae28dbd32b60e77462a64f4bad';
export const EXPECTED_APPLICATION_SHA256 = 'e3884c42af5987b4db154c7f13538054e405e12b496803b8d321ac9a409b62d5';
```

The CLI reads `content/case-study-observations.json`, validates it, and prints the verified observation and application hashes. It must execute only when the module is the process entry point so tests can import without side effects.

- [ ] **Step 5: Add build enforcement**

Add these scripts without changing existing commands:

```json
"case-study:validate": "node scripts/validate-case-study-observations.mjs",
"prebuild": "pnpm case-study:validate"
```

- [ ] **Step 6: Verify and commit the data contract**

Run:

```powershell
pnpm case-study:validate
pnpm vitest run scripts/__tests__/validate-case-study-observations.test.mjs
```

Expected: both PASS and print both supplied hashes.

Commit:

```bash
git add package.json content/case-study-observations.json scripts/validate-case-study-observations.mjs scripts/__tests__/validate-case-study-observations.test.mjs
git commit -m "test: verify pinned case study observations"
```

### Task 2: Derive a typed presentation model

**Files:**
- Create: `content/case-study.ts`
- Create: `app/case-study/lib/model.ts`
- Create: `app/case-study/lib/__tests__/model.test.ts`

- [ ] **Step 1: Write failing model tests**

Import the JSON and require `createCaseStudyModel()` to produce:

- three summaries in `socket-io`, `published-smocket`, `handwritten` order;
- dependencies `socket.io@4.8.3, socket.io-client@4.8.3`, `smocket@0.4.2`, and `None`;
- bootstrap surfaces 61, 28, and 28 lines;
- additional mock surface 212 only for handwritten;
- one shared ten-line transcript;
- participant filters `all`, `alice`, `bob`, `carol` derived from line prefixes;
- categories `all`, `welcome`, `message`, `authorization`, `announcement`, `departure` derived from transcript syntax; and
- structured category models derived from joins, welcomes, messages, authorization acknowledgements, announcements, and departures.

Also test `filterTranscript()` preserves original order and correctly combines participant and category selection.

- [ ] **Step 2: Run the focused tests to verify failure**

Run: `pnpm vitest run app/case-study/lib/__tests__/model.test.ts`

Expected: FAIL because `model.ts` does not exist.

- [ ] **Step 3: Implement types and pure derivation**

Define only the JSON fields consumed by the page. Export `createCaseStudyModel`, `filterTranscript`, `classifyTranscriptLine`, and serializable model types. Locate target files by their `role` rather than array index. Classification rules must use transcript structure (`Welcome`, `Announcement rejected`, ` left #`, ` to #`, ` in #`) rather than participant names or recorded values.

In `content/case-study.ts`, declare the pinned commit, immutable source/document URLs, and wording copied or tightly paraphrased from the authoritative Markdown. Do not repeat versions, counts, environment values, commands, or hashes already present in JSON.

- [ ] **Step 4: Run model tests and typecheck**

Run:

```powershell
pnpm vitest run app/case-study/lib/__tests__/model.test.ts
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit the model**

```bash
git add content/case-study.ts app/case-study/lib
git commit -m "feat: derive case study evidence model"
```

### Task 3: Build the static evidence sections

**Files:**
- Create: `app/case-study/components/ApproachComparison.tsx`
- Create: `app/case-study/components/EvidenceBoundaries.tsx`
- Create: `app/case-study/components/Provenance.tsx`
- Create: `app/case-study/page.tsx`
- Create: `app/case-study/page.module.css`
- Create: `app/case-study/__tests__/page.test.tsx`

- [ ] **Step 1: Write the failing route render test**

Use `react-dom/server` to render the synchronous page component. Assert the markup contains all three data-derived target labels, `same observable result`, `authoritative interpretation`, Fidelity, Reliability, Productivity, `not a transport comparison`, the handwritten no-dependency advantage, the real target's reference-behavior advantage, all reproduction commands, the pinned commit, and both supplied hashes.

- [ ] **Step 2: Run the render test to verify failure**

Run: `pnpm vitest run app/case-study/__tests__/page.test.tsx`

Expected: FAIL because the page does not exist.

- [ ] **Step 3: Compose the server-rendered route**

Load the JSON, call `createCaseStudyModel`, and render semantic sections in the approved order. `ApproachComparison` must use definition lists for target facts. `EvidenceBoundaries` must separate direct observation from inference and retain every limitation. `Provenance` must render commands and hashes in wrapping/scrolling code surfaces and link only to the pinned source or authoritative document.

Use the existing `section`, `inner`, `h2`, `lead`, panel, border, mono font, accent, and shadow tokens. New CSS must not redefine the palette. Add single-column breakpoints at 900 px and 680 px, accessible minimum control sizing, long-token overflow protection, and reduced-motion overrides.

- [ ] **Step 4: Run render test, lint, and typecheck**

Run:

```powershell
pnpm vitest run app/case-study/__tests__/page.test.tsx
pnpm lint
pnpm typecheck
```

Expected: PASS.

### Task 4: Add the interactive observation explorer

**Files:**
- Create: `app/case-study/components/ObservationExplorer.tsx`
- Create: `app/case-study/components/ObservationExplorer.module.css`
- Modify: `app/case-study/page.tsx`
- Modify: `app/case-study/lib/__tests__/model.test.ts`

- [ ] **Step 1: Extend failing interaction-state tests**

Test a pure exported `reduceExplorerState(state, action)` helper for target selection, participant selection, category selection, and reset-to-all. Verify invalid IDs preserve the prior state. This makes the core keyboard/button interaction contract testable without adding a new DOM test dependency.

- [ ] **Step 2: Run the focused test to verify failure**

Run: `pnpm vitest run app/case-study/lib/__tests__/model.test.ts`

Expected: FAIL because the state transition helper is absent.

- [ ] **Step 3: Implement the client explorer**

Render target buttons and filter buttons with `type="button"`, `aria-pressed`, visible labels, and 44 px minimum targets. Keep one common transcript and announce its selected target and filtered count in a polite status. Preserve canonical line order and show an accessible empty state with a reset button.

Render structured categories as a named tablist only if the full WAI-ARIA keyboard behavior is implemented; otherwise use the simpler `aria-pressed` button group. Category panels must render values from the structured observation object, including Bob's rejected moderator action and no delivery, Alice's received Bob message while Bob and Carol receive none, union delivery to all three, and Alice's departure notification.

- [ ] **Step 4: Verify focused tests and static rendering**

Run:

```powershell
pnpm vitest run app/case-study/lib/__tests__/model.test.ts app/case-study/__tests__/page.test.tsx
pnpm lint
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit the page feature**

```bash
git add app/case-study
git commit -m "feat: add interactive application case study"
```

### Task 5: Add route metadata and discoverability

**Files:**
- Create: `app/case-study/layout.tsx`
- Modify: `content/landing.ts`
- Modify: `app/sitemap.ts`
- Modify: `app/case-study/__tests__/page.test.tsx`

- [ ] **Step 1: Add failing discoverability assertions**

Assert the footer content contains a `/case-study` link and the sitemap result contains `${SITE_URL}/case-study` with a lower priority than the homepage.

- [ ] **Step 2: Run the route test to verify failure**

Run: `pnpm vitest run app/case-study/__tests__/page.test.tsx`

Expected: FAIL for the missing footer and sitemap entries.

- [ ] **Step 3: Implement metadata and links**

Add route metadata with title `Application case study`, the selected-workflow boundary in the description, canonical `/case-study`, and matching Open Graph fields. Add `{ label: 'Case study', href: '/case-study', todo: null }` to the existing footer content and add the route to the sitemap with monthly change frequency.

- [ ] **Step 4: Verify and commit discoverability**

Run:

```powershell
pnpm vitest run app/case-study/__tests__/page.test.tsx
pnpm lint
pnpm typecheck
```

Expected: PASS.

Commit:

```bash
git add app/case-study/layout.tsx content/landing.ts app/sitemap.ts app/case-study/__tests__/page.test.tsx
git commit -m "feat: link the application case study"
```

### Task 6: Run repository verification

**Files:**
- Modify only files required to correct failures directly caused by the feature.

- [ ] **Step 1: Validate evidence independently**

Run: `pnpm case-study:validate`

Expected: PASS with observation hash `414b07...4bad` and application hash `e3884c...62d5`.

- [ ] **Step 2: Run all repository checks**

Run separately:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Expected: all exit 0; build lists `/case-study` as a generated route and `prebuild` verifies the artifact first.

- [ ] **Step 3: Inspect the final diff**

Run:

```powershell
git diff main...HEAD --check
git diff main...HEAD --stat
git status --short
```

Expected: no whitespace errors, no unrelated files, and a clean or intentionally staged worktree.

### Task 7: Perform real-browser accessibility and visual QA

**Files:**
- Modify only case-study CSS/component files for issues discovered during QA.

- [ ] **Step 1: Start the production server**

Run `pnpm start` after the successful build and open `http://127.0.0.1:3000/case-study` in the in-app browser.

- [ ] **Step 2: Check desktop light and dark themes**

At approximately 1440×1000, capture full-page screenshots in light and dark. Verify established palette, readable hierarchy, no clipped hashes, correct selected states, and all required limitations.

- [ ] **Step 3: Check mobile layout**

At 375×812, capture a full-page screenshot. Verify single-column ordering, no page-level horizontal overflow, wrapped filters, readable transcript, and 44 px controls.

- [ ] **Step 4: Check interaction and accessibility behavior**

Use keyboard navigation through target, participant, and category controls; confirm visible focus and correct `aria-pressed` state. Exercise filters and reset. Emulate reduced motion and confirm no essential information depends on transitions.

- [ ] **Step 5: Re-run checks after any QA correction**

Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` again. Commit a focused correction only if QA caused changes.

### Task 8: Review, publish the branch, and open the PR

**Files:**
- No source changes unless review finds a concrete defect.

- [ ] **Step 1: Apply verification-before-completion and request code review**

Load the required skills, re-check requirements against the final diff, and resolve only evidence-backed findings. Re-run the relevant focused test after every correction, then all checks.

- [ ] **Step 2: Push the feature branch**

Run: `git push -u origin feat/case-study`

Expected: the remote branch is created.

- [ ] **Step 3: Open the pull request**

Use a body containing summary, verification commands/results, pinned commit and both verified hashes, browser QA, and exactly `Refs electrohyun/smocket#218`. Do not use `Closes`.

- [ ] **Step 4: Collect preview/deployment status**

Inspect PR checks and deployments with GitHub CLI. Report the PR URL and the actual preview/deployment URL if one is published; otherwise report that no provider exposed one yet rather than inventing a URL.

- [ ] **Step 5: Final report**

Report change summary, commit list, full verification evidence, browser QA, PR and preview URLs, pinned source commit, observation SHA-256, application-source SHA-256, and confirmation that the Smocket repository and issue state were not changed.
