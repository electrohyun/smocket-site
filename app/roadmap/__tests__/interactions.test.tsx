// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RoadmapPage from '../page';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function summaryFor(text: string) {
  const summary = screen.getByText(text, { exact: true }).closest('summary');
  if (!summary) throw new Error(`No summary found for ${text}`);
  return summary;
}

describe('roadmap disclosures', () => {
  it('opens a classification with the keyboard and keeps focus on its summary', async () => {
    const user = userEvent.setup();
    render(<RoadmapPage />);

    const required = summaryFor('Required for v1');
    const requiredDetails = required.closest('details')!;

    expect(requiredDetails).not.toHaveAttribute('open');
    required.focus();
    await user.keyboard('{Enter}');

    expect(required).toHaveFocus();
    expect(requiredDetails).toHaveAttribute('open');
    expect(screen.getByText('Open the v1.0.0 milestone')).toBeInTheDocument();
  });

  it('groups classification choices as one quiet reading path', async () => {
    const user = userEvent.setup();
    render(<RoadmapPage />);

    const required = summaryFor('Required for v1');
    const optional = summaryFor('Optional');
    const requiredDetails = required.closest('details')!;
    const optionalDetails = optional.closest('details')!;

    expect(requiredDetails).toHaveAttribute('name', 'classification-outcome');
    expect(optionalDetails).toHaveAttribute('name', 'classification-outcome');

    await user.click(required);
    await user.click(optional);

    expect(requiredDetails).not.toHaveAttribute('open');
    expect(optionalDetails).toHaveAttribute('open');
  });

  it('opens the conditional release rule with a pointer', async () => {
    const user = userEvent.setup();
    render(<RoadmapPage />);

    const conditional = summaryFor('Conditional v0.5.0');
    const details = conditional.closest('details')!;

    expect(details).toHaveAttribute('name', 'release-rule');
    expect(details).not.toHaveAttribute('open');
    await user.click(conditional);

    expect(details).toHaveAttribute('open');
    expect(
      screen.getByText(/does not need to pass through v0.5.0/),
    ).toBeInTheDocument();
  });

  it('opens a dependency with Space and leaves the activated summary focused', async () => {
    const user = userEvent.setup();
    render(<RoadmapPage />);

    const packageBoundaries = summaryFor('Package boundaries');
    const details = packageBoundaries.closest('details')!;

    packageBoundaries.focus();
    await user.keyboard(' ');

    expect(packageBoundaries).toHaveFocus();
    expect(details).toHaveAttribute('open');
    expect(screen.getByText('Decision 0022')).toBeInTheDocument();
    expect(screen.getByText('Decision 0023')).toBeInTheDocument();
  });
});

describe('roadmap journey navigation', () => {
  it('updates the current stop and reading position as the document scrolls', async () => {
    const stopTops: Record<string, number> = {
      guarantee: 900,
      classification: 2100,
      sequence: 3500,
      dependencies: 6200,
      sources: 7600,
    };

    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0, writable: true });
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 9000,
    });
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      const id = this.dataset.journeyStop;
      const top = id ? stopTops[id] - window.scrollY : 0;
      return {
        top,
        bottom: top,
        left: 0,
        right: 0,
        width: 0,
        height: 0,
        x: 0,
        y: top,
        toJSON: () => ({}),
      };
    });
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(0), 0),
    );
    vi.stubGlobal('cancelAnimationFrame', (handle: number) => window.clearTimeout(handle));

    render(<RoadmapPage />);

    const guarantee = screen.getByRole('link', { name: /Guarantee/ });
    const releasePath = screen.getByRole('link', { name: /Release path/ });
    expect(guarantee).toHaveAttribute('aria-current', 'step');

    window.scrollY = 3300;
    window.dispatchEvent(new Event('scroll'));

    await waitFor(() => expect(releasePath).toHaveAttribute('aria-current', 'step'));
    expect(guarantee).not.toHaveAttribute('aria-current');
    expect(screen.getByLabelText('Reading position, 41%')).toBeInTheDocument();
  });
});
