// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { drawingGameCodeModel, type CodeSampleId } from '../../lib/drawing-game-code';
import SituationPanel from '../SituationPanel';

function renderPanel() {
  return render(
    <SituationPanel
      viewpoint="drawer"
      onSwitch={vi.fn()}
      revealed={false}
      onReveal={vi.fn()}
      delayMs={0}
      onDelay={vi.fn()}
      muted={false}
      onMute={vi.fn()}
    />,
  );
}

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  document.body.style.overflow = '';
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.body.style.overflow = '';
});

async function assertSampleCode(sampleId: CodeSampleId, triggerName: string) {
  const user = userEvent.setup();
  renderPanel();
  await user.click(screen.getByRole('button', { name: triggerName }));

  const dialog = screen.getByRole('dialog', { name: drawingGameCodeModel.samples[sampleId].title });
  expect(dialog).toHaveAttribute('aria-modal', 'true');
  expect(within(dialog).getAllByRole('article')).toHaveLength(3);

  for (const card of drawingGameCodeModel.samples[sampleId].cards) {
    const heading = within(dialog).getByRole('heading', { name: card.title });
    const article = heading.closest('article');
    expect(article).not.toBeNull();
    const cardView = within(article!);

    for (const snippet of card.snippets) {
      await user.click(cardView.getByRole('tab', { name: snippet.label }));
      const code = cardView.getByTestId(`snippet-code-${snippet.id}`);
      expect(code.textContent).toBe(snippet.code);
      const source = cardView.getByRole('link', {
        name: `Source at ${drawingGameCodeModel.publicationCommit.slice(0, 7)}`,
      });
      expect(source).toHaveAttribute('href', snippet.sourceUrl);
    }
  }
}

describe('SituationPanel code dialog', () => {
  it('shows every Drawing selection as byte-identical canonical code', async () => {
    await assertSampleCode('drawing', 'View drawing code');
  });

  it('shows every Chat selection as byte-identical canonical code', async () => {
    await assertSampleCode('chat', 'View chat code');
  });

  it('locks scrolling, traps focus, closes on Escape, and restores trigger focus', async () => {
    const user = userEvent.setup();
    renderPanel();
    const trigger = screen.getByRole('button', { name: 'View drawing code' });
    await user.click(trigger);

    const dialog = screen.getByRole('dialog');
    const close = within(dialog).getByRole('button', { name: 'Close code comparison' });
    expect(close).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');

    await user.keyboard('{Shift>}{Tab}{/Shift}');
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]):not([tabindex="-1"]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    expect(focusable[focusable.length - 1]).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
  });

  it('closes from the backdrop and close button while returning focus', async () => {
    const user = userEvent.setup();
    renderPanel();
    const chatTrigger = screen.getByRole('button', { name: 'View chat code' });
    await user.click(chatTrigger);
    fireEvent.mouseDown(screen.getByTestId('demo-code-overlay'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(chatTrigger).toHaveFocus();

    const drawingTrigger = screen.getByRole('button', { name: 'View drawing code' });
    await user.click(drawingTrigger);
    await user.click(screen.getByRole('button', { name: 'Close code comparison' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(drawingTrigger).toHaveFocus();
  });

  it('supports arrow-key navigation between labelled snippet tabs', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole('button', { name: 'View drawing code' }));

    const tablist = screen.getByRole('tablist', { name: 'Shared application handler snippets' });
    const tabs = within(tablist).getAllByRole('tab');
    tabs[0].focus();
    await user.keyboard('{ArrowRight}');
    expect(tabs[1]).toHaveFocus();
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(document.getElementById(tabs[1].getAttribute('aria-controls')!)?.textContent).toBe(
      drawingGameCodeModel.samples.drawing.cards[0].snippets[1].code,
    );
  });
});
