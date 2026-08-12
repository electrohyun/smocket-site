# Vertical Roadmap Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the compact `/roadmap` report into a longer, connected vertical journey with distributed canonical detail and subtle scroll-aware navigation.

**Architecture:** Keep `content/roadmap.ts` as the only roadmap copy source, but enrich each existing release stage with a canonical `next` label and render all major subjects as stops on one route rail. Add a focused client-side `JourneyNav` that derives reading position and the current stop from scroll geometry; native disclosures continue to own optional detail.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, CSS Modules, Vitest 4, jsdom, React Testing Library, user-event.

---

## File map

- Modify `content/roadmap.ts`: add exact next-route labels to the seven existing stages.
- Modify `content/__tests__/roadmap.test.ts`: verify route labels and the conditional rejoin boundary.
- Create `app/roadmap/lib/journey.ts`: pure reading-progress and current-stop derivation.
- Create `app/roadmap/lib/__tests__/journey.test.ts`: pure geometry tests.
- Create `app/roadmap/components/JourneyNav.tsx`: scroll-aware route navigator.
- Modify `app/roadmap/page.tsx`: connect all major sections to one rail and render the expanded release journey.
- Modify `app/roadmap/components/ReleaseStage.tsx`: render route labels and branch/rejoin semantics.
- Modify `app/roadmap/page.module.css`: vertical route, alternating desktop stops, mobile rail, longer spacing, and progress fill.
- Modify `app/roadmap/__tests__/page.test.tsx`: route hierarchy and branch semantics.
- Modify `app/roadmap/__tests__/interactions.test.tsx`: journey navigation current-step and keyboard behavior.

### Task 1: Define route semantics in the data model

- [ ] **Step 1: Add a failing model test**

Require all stages to expose `next`, with these exact route labels:

```ts
expect(roadmap.releaseStages.map((stage) => stage.next)).toEqual([
  'Begin Fidelity & Extensibility review',
  'Classify each finding',
  'Route required patch work to v0.4.3',
  'Ask whether a pre-v1 minor is required',
  'Rejoin the path at stabilization',
  'Finalize the documented v1 guarantee',
  'Stable destination',
]);
```

- [ ] **Step 2: Run `pnpm.cmd test -- content/__tests__/roadmap.test.ts` and observe RED**

Expected: FAIL because `next` is absent.

- [ ] **Step 3: Add `next: string` to `ReleaseStage` and every existing stage**

Do not add issue state, schedule, counts, or new conclusions.

- [ ] **Step 4: Run the focused test and observe GREEN**

### Task 2: Implement pure journey position derivation

- [ ] **Step 1: Create a failing `journey.test.ts`**

Test `deriveJourneyState(scrollY, viewportHeight, documentHeight, stops)` for top,
middle, and bottom positions. Require progress clamped to `0..1` and current stop
chosen from the last stop above the viewport focus line.

- [ ] **Step 2: Run `pnpm.cmd test -- app/roadmap/lib/__tests__/journey.test.ts` and observe RED**

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the pure function in `journey.ts`**

```ts
export type JourneyStop = { id: string; top: number };
export function deriveJourneyState(
  scrollY: number,
  viewportHeight: number,
  documentHeight: number,
  stops: readonly JourneyStop[],
): { progress: number; currentId: string };
```

- [ ] **Step 4: Run the focused test and observe GREEN**

### Task 3: Render one connected vertical route

- [ ] **Step 1: Extend the static page test and observe RED**

Require `data-journey-stop` on all five sections, `Journey through v1.0.0` navigation,
seven `data-route-stage` entries, `Next:` labels, `Conditional branch`, and
`Rejoins at stabilization`. Require the old seven-column language to be absent.

- [ ] **Step 2: Create `JourneyNav.tsx` and revise the route markup**

The navigator lists Guarantee, Classification, Release path, Dependencies, and
Sources. It listens through one requestAnimationFrame scroll handler, calls the
pure helper, applies `aria-current="step"`, and exposes `Reading position, N%`
without calling it project progress.

- [ ] **Step 3: Expand `ReleaseStage.tsx` and CSS**

Use a vertical rail with alternating cards on desktop and one-sided cards on
mobile. Every card shows eyebrow, title, summary, and `Next: {stage.next}`. The
conditional stage uses a dashed side branch and includes a text rejoin label.
Major sections share the same outer rail and use at least 96px vertical spacing.

- [ ] **Step 4: Run the static page test and observe GREEN**

### Task 4: Verify journey interaction

- [ ] **Step 1: Add failing DOM tests**

Stub stop geometry and scroll values, dispatch `scroll`, and require the current
navigation link and accessible reading position to update. Tab to `Release path`,
activate it with Enter, and verify the link remains keyboard reachable. Retain
the existing disclosure click/Enter/Space tests.

- [ ] **Step 2: Run the focused interaction test and observe RED**

- [ ] **Step 3: Make the smallest `JourneyNav` corrections**

Keep all roadmap content readable when JavaScript is absent; only position fill
and current-stop state depend on the client component.

- [ ] **Step 4: Run the focused and full tests and observe GREEN**

### Task 5: Verify and update PR #5

- [ ] **Step 1: Run lint, typecheck, full tests, and production build**

- [ ] **Step 2: Inspect production `/roadmap` at 1440x900 and 375x812 in light and dark themes**

Check the top, classification, release midpoint, conditional branch, dependencies,
and ending source stop. Confirm scroll-aware navigation, anchor links, disclosure
keyboard behavior, no horizontal overflow, no console warnings, and reduced-motion CSS.

- [ ] **Step 3: Commit the revision by meaning**

Use `feat: expand roadmap into vertical journey` for route/content behavior and a
separate `fix:` commit only if browser QA finds a concrete visual defect.

- [ ] **Step 4: Push the branch and wait for PR #5 checks**

Keep the existing concise PR body and issue linkage.
