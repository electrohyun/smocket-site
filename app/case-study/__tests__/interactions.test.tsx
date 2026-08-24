// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import ArchitectureComparison from '../components/ArchitectureComparison';
import ScenarioStepper from '../components/ScenarioStepper';

afterEach(cleanup);

describe('interactive report controls', () => {
  it('changes the architecture explanation with native keyboard controls', async () => {
    const user = userEvent.setup();
    render(<ArchitectureComparison />);

    const real = screen.getByRole('button', { name: 'Real Socket.IO' });
    const smocket = screen.getByRole('button', { name: 'Smocket preview' });
    expect(real).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/external Node HTTP and Socket.IO server/)).toBeInTheDocument();

    await user.tab();
    expect(real).toHaveFocus();
    await user.tab();
    expect(smocket).toHaveFocus();
    await user.keyboard(' ');

    expect(smocket).toHaveAttribute('aria-pressed', 'true');
    expect(real).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText(/caller-owned SharedWorker/)).toBeInTheDocument();
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
