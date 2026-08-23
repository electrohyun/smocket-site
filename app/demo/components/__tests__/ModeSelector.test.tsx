// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

import ModeSelector from '../ModeSelector';

afterEach(() => {
  cleanup();
  push.mockReset();
});

describe('demo mode selector', () => {
  it('names both modes, shows the selected description, and exposes pressed state', () => {
    render(<ModeSelector active="single" />);

    expect(screen.getByRole('button', { name: /Single tab/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Multi tab/ })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Play with scripted players in one page.')).toBeInTheDocument();
  });

  it('navigates to the other route from a keyboard-operable button', async () => {
    const user = userEvent.setup();
    render(<ModeSelector active="single" />);

    const multi = screen.getByRole('button', { name: /Open real tabs/ });
    multi.focus();
    await user.keyboard('{Enter}');

    expect(push).toHaveBeenCalledWith('/demo/multi');
  });

  it('uses a compact current-mode badge for recording entry', () => {
    render(<ModeSelector active="multi" compact />);

    expect(screen.getByLabelText('Current demo mode')).toHaveTextContent('Multi tab');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
