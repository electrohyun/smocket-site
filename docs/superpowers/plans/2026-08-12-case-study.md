# Comparison-first Case Study Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the transcript-led `/case-study` draft with a technical report whose primary subject is the setup, authored code, implementation evidence, and maintenance surface owned by Real Socket.IO, published Smocket, and a handwritten mock.

**Architecture:** Keep the existing pinned observation validator, then add hash-verified vendored source snapshots and derive all comparison figures, tables, excerpts, and behavior evidence from those sources plus `observations.json`. Render a compact server report with two focused client interactions—approach evidence and workflow evidence—while moving the identical transcript into a supporting disclosure.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, CSS Modules, Node `crypto`, Vitest 4, jsdom, React Testing Library, user-event.

---

## File map

- Modify `content/case-study.ts`: separate source/document revisions and static interpretation copy.
- Create `content/case-study-sources/**`: exact pinned shared and target-owned JavaScript snapshots.
- Modify `scripts/validate-case-study-observations.mjs`: validate every vendored source against JSON file hashes.
- Modify `scripts/__tests__/validate-case-study-observations.test.mjs`: source-hash contract tests.
- Refactor `app/case-study/lib/model.ts`: derive authored-surface segments, comparison rows, excerpts, behavior matrix, and evidence panels.
- Refactor `app/case-study/lib/__tests__/model.test.ts`: exact comparison and excerpt derivation tests.
- Create `app/case-study/components/ReportHeader.tsx`: compact abstract and record metadata.
- Create `app/case-study/components/Method.tsx`: research question, method, and shared-file evidence.
- Create `app/case-study/components/AuthoredSurface.tsx`: contextual stacked bars and comparison table.
- Create `app/case-study/components/ApproachEvidence.tsx`: interactive pinned setup/code evidence.
- Create `app/case-study/components/BehaviorMatrix.tsx`: interactive workflow pass/evidence matrix.
- Refactor `app/case-study/components/ObservationExplorer.tsx`: supporting transcript disclosure only.
- Modify `app/case-study/components/EvidenceBoundaries.tsx`: report-style interpretation and limitations.
- Modify `app/case-study/components/Provenance.tsx`: correct two-revision provenance.
- Refactor `app/case-study/page.tsx` and `page.module.css`: report hierarchy and document visual system.
- Add `app/case-study/__tests__/interactions.test.tsx`: real DOM click/keyboard/focus tests.
- Add `vitest.config.ts` and modify `package.json`/`pnpm-lock.yaml`: jsdom and Testing Library setup.

### Task 1: Pin and validate compared source files

**Files:**
- Create: `content/case-study-sources/examples/chat-room/app.js`
- Create: `content/case-study-sources/examples/chat-room/scenario.js`
- Create: `content/case-study-sources/examples/chat-room/assertions.js`
- Create: `content/case-study-sources/case-studies/chat-room/fixtures/socket-io/bootstrap.js`
- Create: `content/case-study-sources/case-studies/chat-room/fixtures/published-smocket/bootstrap.js`
- Create: `content/case-study-sources/case-studies/chat-room/fixtures/handwritten/bootstrap.js`
- Create: `content/case-study-sources/case-studies/chat-room/fixtures/handwritten/handwritten-socket-io.js`
- Modify: `scripts/validate-case-study-observations.mjs`
- Modify: `scripts/__tests__/validate-case-study-observations.test.mjs`
- Modify: `content/case-study.ts`

- [ ] **Step 1: Add failing source-contract tests**

Test `validateSourceFiles(record, readSource)` with real vendored paths and mutations. Require successful verification of all seven files and field-specific failure for missing files or changed SHA-256. Also assert the authoritative document URL uses `6a17477beef33fb014ab629b914d80a6f144b31b`, while observation/source URLs use `fa90e07e272c7fd0db64ebfd73cbb104664ddb81`.

- [ ] **Step 2: Run the validator suite and observe RED**

Run: `node_modules\.bin\vitest.CMD run scripts\__tests__\validate-case-study-observations.test.mjs`

Expected: FAIL because `validateSourceFiles` and corrected document revision are absent.

- [ ] **Step 3: Vendor exact source bytes**

Fetch only immutable `raw.githubusercontent.com/electrohyun/smocket/fa90e07.../<path>` URLs, add the returned bytes with `apply_patch`, and verify each local SHA-256 equals its `observations.json` file entry. Preserve line endings and terminal newline exactly.

- [ ] **Step 4: Implement reusable source verification**

Export:

```js
export async function validateSourceFiles(record, readSource) {
  // Resolve shared files from record.application.files and target-owned files
  // from record.targets[*].files, excluding package manifests/lockfiles.
  // Hash each vendored file and throw with its source path on mismatch.
}
```

The CLI calls it after `validateObservationBytes` and prints the count of verified source files. Correct `caseStudyLinks.authoritativeDocument` to the publication revision.

- [ ] **Step 5: Verify and commit**

Run `pnpm.cmd case-study:validate` and the focused validator tests. Expected: seven source snapshots and both aggregate hashes verified.

Commit: `test: verify pinned case study source evidence`

### Task 2: Derive the comparison report model

**Files:**
- Modify: `app/case-study/lib/model.ts`
- Modify: `app/case-study/lib/__tests__/model.test.ts`

- [ ] **Step 1: Add failing comparison-model tests**

Require `createCaseStudyModel()` to derive:

```ts
authoredSurfaces: [
  { id: 'socket-io', segments: [{ role: 'bootstrap', lines: 61 }], total: 61 },
  { id: 'published-smocket', segments: [{ role: 'bootstrap', lines: 28 }], total: 28 },
  { id: 'handwritten', segments: [
    { role: 'bootstrap', lines: 28 },
    { role: 'mock implementation', lines: 212 },
  ], total: 240 },
]
```

Also require exact comparison rows for dependency/setup, HTTP/port ownership, activation/shutdown, owned files, mock ownership, shared branches/workarounds, explicit source error paths, change locations, and simpler aspects. Require `behaviorRows` for join, welcome, message, authorization, union broadcast, and disconnect, each with three pass cells and assertion/application/handwritten evidence IDs.

- [ ] **Step 2: Run focused tests and observe RED**

Run: `node_modules\.bin\vitest.CMD run app\case-study\lib\__tests__\model.test.ts`

Expected: FAIL for missing comparison fields.

- [ ] **Step 3: Implement source excerpt derivation**

Import vendored files with `?raw` only if supported by Next/Vitest consistently; otherwise generate typed string modules at build time from the vendored snapshots. Define tested, central line ranges such as Real bootstrap server/listen/client setup, Smocket in-memory setup, handwritten bootstrap, handwritten routing, acknowledgement, and disconnect regions. Return excerpt text by splitting the verified source string; never duplicate source text in presentation modules.

- [ ] **Step 4: Implement comparison and behavior evidence models**

Derive all numeric fields from JSON. Static ownership/error-path descriptions stay in `content/case-study.ts` and are explicitly labeled `Observed source path` or `Inference`. Verify no target selector can alter the shared observation.

- [ ] **Step 5: Verify and commit**

Run focused model tests and `pnpm.cmd typecheck`. Commit: `feat: derive approach comparison evidence`

### Task 3: Rebuild the page as a technical report

**Files:**
- Create: `app/case-study/components/ReportHeader.tsx`
- Create: `app/case-study/components/Method.tsx`
- Create: `app/case-study/components/AuthoredSurface.tsx`
- Modify: `app/case-study/page.tsx`
- Rewrite: `app/case-study/page.module.css`
- Modify: `app/case-study/__tests__/page.test.tsx`

- [ ] **Step 1: Replace static markup expectations first**

Assert the report has `Abstract`, numbered method/comparison headings, exact `61`, `28`, `28 + 212`, a comparison `<table>`, the three shared source file names and roles, no old marketing title, and no decorative hero orbit class/content.

- [ ] **Step 2: Run page tests and observe RED**

Run the page test; expected failures identify the old hero/card hierarchy.

- [ ] **Step 3: Implement compact report header and method**

Render title, abstract, record metadata, correct authoritative link, claim boundary, research question, method note, and shared source table. The report begins within the first desktop viewport.

- [ ] **Step 4: Implement contextual stacked bars and comparison table**

Use one 240-line scale. Each bar renders exact text labels and CSS width from `segment.lines / 240`. Use a semantic figure/caption plus a real table on desktop; at 680px CSS converts table rows into labeled blocks without hiding headers from assistive technology.

- [ ] **Step 5: Implement restrained document styling**

Remove the viewport-height hero and orbit. Keep stars as background, add a bounded report surface, restrained heading scale, numbered sections, rules, captions, and overflow containment. Add light/dark/reduced-motion styles and 375px layout.

- [ ] **Step 6: Verify and commit**

Run page tests, lint, typecheck. Commit: `feat: present case study as comparison report`

### Task 4: Add approach implementation evidence

**Files:**
- Create: `app/case-study/components/ApproachEvidence.tsx`
- Create: `app/case-study/components/ApproachEvidence.module.css`
- Modify: `app/case-study/__tests__/page.test.tsx`

- [ ] **Step 1: Add failing server-render and state-transition tests**

Require approach controls, initial Real evidence, each target's owned file names, immutable source URLs, and handwritten supported/omitted behavior lists. Test a pure reducer that changes selected approach and handwritten excerpt while rejecting invalid IDs.

- [ ] **Step 2: Run tests and observe RED**

Expected: missing approach-evidence component/state.

- [ ] **Step 3: Implement evidence-changing controls**

Buttons use `aria-pressed`. Selection changes dependency/setup summary, owned files, explicit source error paths, bootstrap excerpt, source link, and handwritten mock excerpt controls. Use `<pre><code>` with line numbers and an evidence caption.

- [ ] **Step 4: Verify and commit**

Run focused page/model tests, lint, typecheck. Commit: `feat: explore pinned target implementation evidence`

### Task 5: Add workflow behavior matrix and demote transcript

**Files:**
- Create: `app/case-study/components/BehaviorMatrix.tsx`
- Create: `app/case-study/components/BehaviorMatrix.module.css`
- Modify: `app/case-study/components/ObservationExplorer.tsx`
- Modify: `app/case-study/components/ObservationExplorer.module.css`
- Modify: `app/case-study/page.tsx`

- [ ] **Step 1: Add failing matrix state and markup tests**

Require six behavior rows, three `Passed · same observation` cells per row, a caption limiting the result, and initial join evidence. Test behavior selection changes structured value plus assertion/application/handwritten excerpts. Require transcript inside a native `<details>` and assert no transcript target selector exists.

- [ ] **Step 2: Run focused tests and observe RED**

Expected: matrix missing and old transcript target selector still present.

- [ ] **Step 3: Implement the matrix interaction**

Use row buttons with `aria-pressed` and `aria-controls`. Evidence panel renders the exact JSON-derived observation plus pinned assertion/application source. Handwritten evidence appears only when mapped; it never implies unexercised compatibility.

- [ ] **Step 4: Refactor transcript to supporting evidence**

Remove approach state. Wrap participant/event filters and canonical transcript in `<details>`. Preserve filtering order and empty/reset state.

- [ ] **Step 5: Verify and commit**

Run focused tests, lint, typecheck. Commit: `feat: connect workflow results to implementation evidence`

### Task 6: Finish interpretation and two-revision provenance

**Files:**
- Modify: `app/case-study/components/EvidenceBoundaries.tsx`
- Modify: `app/case-study/components/Provenance.tsx`
- Modify: `content/case-study.ts`
- Modify: `app/case-study/__tests__/page.test.tsx`

- [ ] **Step 1: Add failing boundary/provenance assertions**

Require report subsections rather than cards, all caveats, neutral findings, `Inference`, compared-source revision, authoritative-publication revision, and correct immutable links.

- [ ] **Step 2: Implement and verify**

Preserve every prior evidence boundary. Run page tests, lint, typecheck. Commit: `fix: align report links and evidence boundaries`

### Task 7: Add real DOM interaction and keyboard tests

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `vitest.config.ts`
- Create: `app/case-study/__tests__/interactions.test.tsx`

- [ ] **Step 1: Install test dependencies**

Run:

```powershell
pnpm.cmd add -D @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

- [ ] **Step 2: Write failing DOM tests before any test-only adaptation**

With jsdom, render the actual approach explorer, behavior matrix, and transcript disclosure. Use `userEvent.click`, `userEvent.tab`, and `userEvent.keyboard('{Enter}')`/`'{Space}'`. Assert visible code/file evidence changes, focus order, `aria-pressed`, `aria-expanded`/`open`, filters, and reset.

- [ ] **Step 3: Run DOM tests and observe RED**

Expected: failures expose missing keyboard/focus or queryable semantics, not missing mocks.

- [ ] **Step 4: Make only accessibility adaptations required by tests**

Do not add test-only production APIs. Use native controls, stable accessible names, and real DOM state.

- [ ] **Step 5: Verify and commit**

Run DOM tests plus full test suite. Commit: `test: exercise case study interactions in the DOM`

### Task 8: Complete verification and browser QA

**Files:**
- Modify only case-study files for defects reproduced during QA.

- [ ] **Step 1: Run all repository checks**

Run separately: `pnpm.cmd case-study:validate`, `pnpm.cmd lint`, `pnpm.cmd typecheck`, `pnpm.cmd test`, and `pnpm.cmd build`. Require exit 0 and static `/case-study` generation.

- [ ] **Step 2: Inspect the actual page in a browser**

Use the local production server or unprotected preview. Capture and inspect:

- desktop light;
- desktop dark;
- 375×812 light;
- 375×812 dark; and
- reduced-motion state.

Exercise approach selection, handwritten mock excerpts, every behavior matrix row, transcript disclosure/filtering, and keyboard focus. Verify no page overflow, clipped bars/hashes/code, or information hidden by theme.

- [ ] **Step 3: Fix every reproduced issue with a failing test where practical**

Re-run focused checks after each correction, then all five commands again.

- [ ] **Step 4: Review and update the existing PR**

Push `feat/case-study-pr`. Update PR #3 summary and screenshots/QA evidence; keep `Refs electrohyun/smocket#218`. Report preview accessibility truthfully.

## Plan self-review

- Spec coverage: Tasks 1–6 implement every hierarchy and traceability row; Task 7 covers real DOM interaction; Task 8 covers all required browser/theme/viewport states.
- Data boundaries: all figures and behavior results derive from verified JSON; code excerpts derive from verified vendored sources; interpretation copy remains bounded by the authoritative report.
- Type consistency: approach IDs remain `socket-io | published-smocket | handwritten`; behavior IDs remain `join | welcome | message | authorization | announcement | disconnect`; source evidence uses one excerpt model across approach and matrix views.
- Scope: only `/case-study`, its data contract, its tests, and existing discoverability are changed. No unrelated landing/demo refactor is included.
