// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import RuntimeGuide from '../components/RuntimeGuide';
import ScenarioStepper from '../components/ScenarioStepper';

afterEach(cleanup);

describe('application case study controls', () => {
  it('changes the runtime explanation with native keyboard controls', async () => {
    const user = userEvent.setup();
    render(<RuntimeGuide />);

    const nodeTest = screen.getByRole('button', { name: /Node tests/ });
    const sharedWorker = screen.getByRole('button', { name: /SharedWorker tabs/ });
    expect(nodeTest).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/without opening a port/)).toBeInTheDocument();

    await user.tab();
    expect(nodeTest).toHaveFocus();
    await user.tab();
    await user.tab();
    expect(sharedWorker).toHaveFocus();
    await user.keyboard(' ');

    expect(sharedWorker).toHaveAttribute('aria-pressed', 'true');
    expect(nodeTest).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText(/same-origin tabs need to share/)).toBeInTheDocument();
  });

  it('lets a reader inspect each drawing-game event step', async () => {
    const user = userEvent.setup();
    render(<ScenarioStepper />);

    const connect = screen.getByRole('button', { name: /CONNECT ×3/ });
    const stroke = screen.getByRole('button', { name: /STROKE ×N/ });
    expect(connect).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Open three player tabs' })).toBeInTheDocument();

    await user.click(stroke);
    expect(stroke).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Draw in Player A' })).toBeInTheDocument();
    expect(screen.getByText(/A keeps its local drawing/)).toBeInTheDocument();
    expect(screen.getByText(/socket.to\(session\)/)).toBeInTheDocument();
  });
});
