// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SituationPanel from '../SituationPanel';

afterEach(cleanup);

function renderPanel(viewpoint: 'drawer' | 'observer' = 'drawer') {
  const props = {
    viewpoint,
    onSwitch: vi.fn(),
    revealed: false,
    onReveal: vi.fn(),
    delayMs: 0,
    onDelay: vi.fn(),
  };
  render(<SituationPanel {...props} />);
  return props;
}

describe('Single tab controls', () => {
  it('removes the old code comparison prompt and Drawing/Chat modal triggers', () => {
    renderPanel();

    expect(screen.queryByText(/Built with Smocket/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /drawing code/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /chat code/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps the drawer viewpoint switch working without a dead sound control', async () => {
    const user = userEvent.setup();
    const props = renderPanel('drawer');

    expect(screen.queryByRole('button', { name: /sound/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'switch to the observer' }));

    expect(props.onSwitch).toHaveBeenCalledOnce();
  });

  it('keeps observer-only reveal and delivery delay controls', async () => {
    const user = userEvent.setup();
    const props = renderPanel('observer');

    await user.click(screen.getByRole('button', { name: 'reveal the word' }));
    await user.click(screen.getByRole('slider', { name: "Delay B's delivery, in milliseconds" }));

    expect(props.onReveal).toHaveBeenCalledWith(true);
    expect(screen.getByText('DelayingAdapter')).toBeInTheDocument();
  });
});
