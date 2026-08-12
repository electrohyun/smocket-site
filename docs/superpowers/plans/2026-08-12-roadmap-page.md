# Public v1.0.0 Roadmap Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a reading-first `/roadmap` page that presents smocket's canonical v1.0.0 guarantee, review classification, conditional pre-v1 release sequence, dependencies, and non-goals without becoming a second status source.

**Architecture:** Store durable roadmap copy and canonical links in one typed static content module, then render a server page with semantic native disclosures and a responsive CSS release flow. Reuse the existing theme toggle, footer, global tokens, report-style surface, metadata, sitemap, and jsdom test setup; add no backend, runtime GitHub fetch, or progress calculation.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, CSS Modules, Vitest 4, jsdom, React Testing Library, user-event.

---

## File map

- Create `content/roadmap.ts`: typed durable copy, release stages, classifications, dependencies, and canonical URLs.
- Create `content/__tests__/roadmap.test.ts`: content boundary and link contract tests.
- Create `app/roadmap/layout.tsx`: route metadata and canonical URL.
- Create `app/roadmap/page.tsx`: semantic report hierarchy.
- Create `app/roadmap/page.module.css`: document surface, responsive release flow, disclosures, themes, and reduced-motion boundary.
- Create `app/roadmap/__tests__/page.test.tsx`: static hierarchy and publication tests.
- Create `app/roadmap/__tests__/interactions.test.tsx`: pointer, keyboard, focus, and native disclosure tests.
- Modify `content/landing.ts`: add the shared footer entry.
- Modify `app/sitemap.ts`: publish `/roadmap`.

### Task 1: Define the canonical roadmap presentation model

**Files:**
- Create: `content/__tests__/roadmap.test.ts`
- Create: `content/roadmap.ts`

- [ ] **Step 1: Write the failing content contract test**

Create assertions for the exact canonical roadmap URL, milestone URL, ADR 0019 URL, guarantee statement, five non-goals, four classification outcomes, release stage order, `conditional: true` on v0.5.0, and required dependency links. Reject status-like fields:

```ts
expect(roadmap.releaseStages.map((stage) => stage.id)).toEqual([
  'v0.4.2',
  'review',
  'classify',
  'v0.4.3',
  'v0.5.0',
  'stabilization',
  'v1.0.0',
]);
expect(roadmap.releaseStages.find((stage) => stage.id === 'v0.5.0')).toMatchObject({
  conditional: true,
});
expect(JSON.stringify(roadmap)).not.toMatch(/percentage|openIssues|closedIssues|dueDate/);
```

- [ ] **Step 2: Run the focused test and observe RED**

Run: `pnpm.cmd vitest run content/__tests__/roadmap.test.ts`

Expected: FAIL because `content/roadmap.ts` does not exist.

- [ ] **Step 3: Implement the typed static model**

Export `roadmapLinks` and `roadmap` with readonly arrays for:

```ts
type RoadmapDisclosure = {
  id: string;
  title: string;
  summary: string;
  detail: string;
  links: readonly { label: string; href: string }[];
};

type ReleaseStage = {
  id: string;
  label: string;
  eyebrow: string;
  summary: string;
  detail?: string;
  conditional?: boolean;
};
```

Use only statements found in `smocket/docs/roadmap.md`. Keep milestone counts, issue states, dates, percentages, and inferred schedules out of the model.

- [ ] **Step 4: Run the focused test and observe GREEN**

Run: `pnpm.cmd vitest run content/__tests__/roadmap.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add content/roadmap.ts content/__tests__/roadmap.test.ts
git commit -m "feat: define public roadmap content"
```

### Task 2: Render the reading-first roadmap report

**Files:**
- Create: `app/roadmap/__tests__/page.test.tsx`
- Create: `app/roadmap/layout.tsx`
- Create: `app/roadmap/page.tsx`
- Create: `app/roadmap/page.module.css`

- [ ] **Step 1: Write the failing static render test**

Render `RoadmapPage` to static markup and require:

```ts
expect(markup).toContain('Roadmap to v1.0.0');
expect(markup).toContain('The GitHub roadmap owns policy and current status.');
expect(markup).toContain('What v1.0.0 aims to stabilize');
expect(markup).toContain('What v1.0.0 does not promise');
expect(markup).toContain('Fidelity and Extensibility review');
expect(markup).toContain('Conditional v0.5.0');
expect(markup).toContain('Release-order dependencies');
expect(markup).not.toMatch(/% complete|open issues|closed issues/i);
expect(metadata.alternates).toEqual({ canonical: '/roadmap' });
```

Also require semantic `nav`, `figure`, `figcaption`, ordered sequence markup, and native `details`/`summary` elements.

- [ ] **Step 2: Run the static test and observe RED**

Run: `pnpm.cmd vitest run app/roadmap/__tests__/page.test.tsx`

Expected: FAIL because the route does not exist.

- [ ] **Step 3: Implement metadata and page hierarchy**

Create route metadata:

```ts
export const metadata: Metadata = {
  title: 'Roadmap to v1.0.0',
  description: 'The guarantee, review gates, dependencies, and conditional release path toward smocket v1.0.0.',
  alternates: { canonical: '/roadmap' },
};
```

Render the compact header, section navigation, guarantee/non-goal lists, four classification disclosures, release-flow figure with conditional label, release policy disclosures, dependency disclosures, change process, canonical links, `ThemeToggle`, and shared `Footer`.

- [ ] **Step 4: Implement responsive CSS**

Use existing tokens only. Desktop uses a bounded report surface and horizontal main flow. At `max-width: 720px`, stack the flow vertically, retain textual connectors, and keep eight-pixel page gutters. Give each `summary` a minimum 44px target and visible hover/focus treatment. Add:

```css
@media (prefers-reduced-motion: reduce) {
  :global(body)::before { animation: none !important; }
  .report *, .report *::before, .report *::after {
    transition-duration: .01ms !important;
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

- [ ] **Step 5: Run the focused test and observe GREEN**

Run: `pnpm.cmd vitest run app/roadmap/__tests__/page.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add app/roadmap
git commit -m "feat: add public roadmap report"
```

### Task 3: Add subtle, keyboard-accessible interactions

**Files:**
- Create: `app/roadmap/__tests__/interactions.test.tsx`
- Modify: `app/roadmap/page.tsx`
- Modify: `app/roadmap/page.module.css`

- [ ] **Step 1: Write the failing DOM interaction tests**

Use jsdom and `user-event` to verify:

```ts
const required = screen.getByText('Required for v1');
const requiredDetails = required.closest('details')!;
expect(requiredDetails).not.toHaveAttribute('open');
required.focus();
await user.keyboard('{Enter}');
expect(requiredDetails).toHaveAttribute('open');
expect(required).toHaveFocus();

const conditional = screen.getByText('Conditional v0.5.0');
await user.click(conditional);
expect(conditional.closest('details')).toHaveAttribute('open');

const dependencies = screen.getByText('Package boundaries');
dependencies.focus();
await user.keyboard(' ');
expect(dependencies.closest('details')).toHaveAttribute('open');
```

Also tab through the section navigation and first disclosure to verify useful document order.

- [ ] **Step 2: Run the interaction test and observe RED**

Run: `pnpm.cmd vitest run app/roadmap/__tests__/interactions.test.tsx`

Expected: FAIL until accessible labels, disclosure structure, and focus order match the design.

- [ ] **Step 3: Make the smallest markup and style corrections**

Keep native `details` behavior; do not introduce client state. Add only accessible summary labels, link placement, and CSS marker/focus treatments needed by the tests.

- [ ] **Step 4: Run focused and full tests and observe GREEN**

Run:

```powershell
pnpm.cmd vitest run app/roadmap/__tests__/interactions.test.tsx
pnpm.cmd test
```

Expected: interaction tests pass and the full suite remains green.

- [ ] **Step 5: Commit**

```powershell
git add app/roadmap
git commit -m "test: cover roadmap disclosures"
```

### Task 4: Publish the route from shared discovery surfaces

**Files:**
- Modify: `app/roadmap/__tests__/page.test.tsx`
- Modify: `content/landing.ts`
- Modify: `app/sitemap.ts`

- [ ] **Step 1: Add failing footer and sitemap assertions**

```ts
expect(footer.links).toContainEqual({ label: 'Roadmap', href: '/roadmap', todo: null });
expect(sitemap()).toContainEqual({
  url: `${SITE_URL}/roadmap`,
  changeFrequency: 'monthly',
  priority: 0.7,
});
```

- [ ] **Step 2: Run the page test and observe RED**

Run: `pnpm.cmd vitest run app/roadmap/__tests__/page.test.tsx`

Expected: FAIL because the footer and sitemap entries are absent.

- [ ] **Step 3: Add the shared entries**

Place `Roadmap` before `Case study` in `footer.links`. Add `/roadmap` to the sitemap without changing landing or demo markup.

- [ ] **Step 4: Run the page and full suites and observe GREEN**

Run `pnpm.cmd vitest run app/roadmap/__tests__/page.test.tsx` and `pnpm.cmd test`.

- [ ] **Step 5: Commit**

```powershell
git add content/landing.ts app/sitemap.ts app/roadmap/__tests__/page.test.tsx
git commit -m "feat: link the public roadmap"
```

### Task 5: Complete checks, visual review, and delivery

**Files:**
- Modify only files required by findings from the checks.

- [ ] **Step 1: Run repository checks**

Run:

```powershell
pnpm.cmd lint
pnpm.cmd typecheck
pnpm.cmd test
pnpm.cmd build
```

Expected: all commands exit zero and the build lists `/roadmap` as static.

- [ ] **Step 2: Run a production server and inspect the real page**

Open `/roadmap` at 1440×900 and 375×812 in light and dark themes. Check disclosure clicks, Enter/Space activation, visible focus, canonical links, no console errors, and no page-level horizontal overflow. Confirm the reduced-motion media rule disables report transitions and the star field.

- [ ] **Step 3: Fix only verified defects**

For every defect, add or adjust a failing test when it is behavioral, make the smallest fix, and rerun the relevant focused check.

- [ ] **Step 4: Run the complete checks again**

Run lint, typecheck, full tests, and build from a clean tree after any QA correction.

- [ ] **Step 5: Push and create the PR**

Push `feat/roadmap-page`, create a PR using the repository template, keep the body concise, and include:

```md
## Summary

- Add the public `/roadmap` overview and responsive pre-v1 release flow.
- Present v1 guarantees, non-goals, review classification, dependencies, and canonical links without duplicating issue status.
- Add keyboard-accessible disclosures, footer discovery, sitemap entry, and route coverage.

## Related issue

Closes #2
```

- [ ] **Step 6: Inspect smocket follow-up work**

Read the canonical roadmap, issue #216, discussion #213, README/docs navigation, and any site-link references. Report exact edits that would be appropriate after the production `/roadmap` URL is known; do not modify the smocket repository without a separate request.
