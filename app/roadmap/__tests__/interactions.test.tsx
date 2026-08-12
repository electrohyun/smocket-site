// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import RoadmapPage from '../page';

afterEach(cleanup);

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
