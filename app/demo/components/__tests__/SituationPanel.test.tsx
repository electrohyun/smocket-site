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

async function openSample(sampleId: CodeSampleId) {
  const user = userEvent.setup();
  renderPanel();
  await user.click(
    screen.getByRole('button', {
      name: sampleId === 'drawing' ? 'View drawing code' : 'View chat code',
    }),
  );

  const sample = drawingGameCodeModel.samples[sampleId];
  const dialog = screen.getByRole('dialog', { name: sample.title });
  return { user, sample, dialog };
}

function columnView(dialog: HTMLElement, title: string) {
  const heading = within(dialog).getByRole('heading', { name: title });
  const article = heading.closest('article');
  expect(article).not.toBeNull();
  return within(article!);
}

function expectFixedColumns(dialog: HTMLElement, sampleId: CodeSampleId) {
  const sample = drawingGameCodeModel.samples[sampleId];
  expect(within(dialog).getAllByRole('article')).toHaveLength(3);
  expect(within(dialog).queryByRole('tab')).not.toBeInTheDocument();
  expect(within(dialog).queryByRole('tablist')).not.toBeInTheDocument();
  expect(within(dialog).getAllByRole('button')).toHaveLength(1);

  for (const column of sample.columns) {
    const card = columnView(dialog, column.title);
    expect(card.getByTestId(`snippet-code-${column.snippet.id}`).textContent).toBe(
      column.snippet.code,
    );
    expect(
      card.getByRole('link', {
        name: `Verified source · ${drawingGameCodeModel.publicationCommit.slice(0, 7)} · SHA-256 ${column.snippet.sourceSha256.slice(0, 10)}…`,
      }),
    ).toHaveAttribute('href', column.snippet.sourceUrl);
  }
}

describe('SituationPanel code dialog', () => {
  it('shows the fixed Drawing comparison with canonical code and consistent card copy', async () => {
    const { dialog, sample } = await openSample('drawing');
    expectFixedColumns(dialog, 'drawing');

    expect(sample.columns.map(({ snippet }) => snippet.id)).toEqual([
      'real.3-sender-excluded-stroke',
      'smocket.3-sender-excluded-stroke',
      'handwritten.sender-exclusion.source.transport',
    ]);
    const real = columnView(dialog, 'Real Socket.IO');
    expect(real.getByText('Application event handler')).toBeInTheDocument();
    expect(real.getByText('Behavior reference')).toBeInTheDocument();
    const smocket = columnView(dialog, 'Smocket');
    expect(smocket.getByText('Same application event handler')).toBeInTheDocument();
    expect(smocket.getByText('0 LOC changed')).toBeInTheDocument();
    const handwritten = columnView(dialog, 'Handwritten mock');
    expect(handwritten.getByText('Application-owned mock transport')).toBeInTheDocument();
    expect(handwritten.getByText('Room broadcast and sender exclusion')).toBeInTheDocument();
  });

  it('shows the fixed Chat comparison with canonical code and consistent card copy', async () => {
    const { dialog, sample } = await openSample('chat');
    expectFixedColumns(dialog, 'chat');

    expect(sample.columns.map(({ snippet }) => snippet.id)).toEqual([
      'real.5-correct-guess',
      'smocket.5-correct-guess',
      'handwritten.targeted-delivery.source.transport',
    ]);
    const real = columnView(dialog, 'Real Socket.IO');
    expect(real.getByText('Application event handler')).toBeInTheDocument();
    expect(real.getByText('Behavior reference')).toBeInTheDocument();
    const smocket = columnView(dialog, 'Smocket');
    expect(smocket.getByText('Same application event handler')).toBeInTheDocument();
    expect(smocket.getByText('0 LOC changed')).toBeInTheDocument();
    const handwritten = columnView(dialog, 'Handwritten mock');
    expect(handwritten.getByText('Application-owned mock transport')).toBeInTheDocument();
    expect(handwritten.getByText('Acknowledgement and socket-id targeting')).toBeInTheDocument();
  });

  it.each<CodeSampleId>(['drawing', 'chat'])(
    'keeps %s Real and Smocket handler code, hashes, and line positions equal',
    async (sampleId) => {
      const { dialog, sample } = await openSample(sampleId);
      const real = sample.columns[0];
      const smocket = sample.columns[1];
      const realCard = columnView(dialog, real.title);
      const smocketCard = columnView(dialog, smocket.title);

      expect(real.snippet.code).toBe(smocket.snippet.code);
      expect(real.snippet.sourceSha256).toBe(smocket.snippet.sourceSha256);
      expect(realCard.getByTestId(`snippet-code-${real.snippet.id}`).textContent).toBe(
        smocketCard.getByTestId(`snippet-code-${smocket.snippet.id}`).textContent,
      );
      expect(real.lines.map(({ lineNumber }) => lineNumber)).toEqual(
        smocket.lines.map(({ lineNumber }) => lineNumber),
      );
      expect(realCard.getByTitle(real.snippet.sourceSha256)).toHaveTextContent(
        real.snippet.sourceSha256.slice(0, 10),
      );
      expect(smocketCard.getByTitle(smocket.snippet.sourceSha256)).toHaveTextContent(
        smocket.snippet.sourceSha256.slice(0, 10),
      );
    },
  );

  it.each<CodeSampleId>(['drawing', 'chat'])(
    'shows compact verified-source provenance without measurements or artifact ids for %s',
    async (sampleId) => {
      const { dialog, sample } = await openSample(sampleId);

      expect(dialog).toHaveTextContent(
        'Same recorded behavior. Real and Smocket share the application handler; the handwritten mock implements the transport support in the application.',
      );
      expect(dialog.querySelector('footer')).not.toBeInTheDocument();
      expect(within(dialog).queryByRole('figure')).not.toBeInTheDocument();
      expect(within(dialog).queryByRole('progressbar')).not.toBeInTheDocument();
      expect(dialog).not.toHaveTextContent('+18');
      expect(dialog).not.toHaveTextContent('+140');
      expect(dialog).not.toHaveTextContent('Measured source total');
      expect(dialog).not.toHaveTextContent('Transport implementation');
      expect(dialog).not.toHaveTextContent('Application bootstrap');
      expect(dialog).not.toHaveTextContent('Client substitution');
      expect(dialog).not.toHaveTextContent('Loader registration');
      expect(dialog).not.toHaveTextContent('smocket-client-substitution');
      expect(dialog).not.toHaveTextContent('register-loader');

      for (const column of sample.columns) {
        const card = columnView(dialog, column.title);
        expect(card.queryByText(column.snippet.id)).not.toBeInTheDocument();
        expect(
          card.getByRole('link', {
            name: `Verified source · ${drawingGameCodeModel.publicationCommit.slice(0, 7)} · SHA-256 ${column.snippet.sourceSha256.slice(0, 10)}…`,
          }),
        ).toHaveAttribute('title', column.snippet.sourceSha256);
      }
    },
  );

  it('highlights the sender-exclusion correspondence without unrelated Drawing lines', async () => {
    const { dialog, sample } = await openSample('drawing');
    for (const column of sample.columns.slice(0, 2)) {
      const code = columnView(dialog, column.title).getByTestId(
        `snippet-code-${column.snippet.id}`,
      );
      expect(code.querySelectorAll('[data-semantic-highlight="key"]')).toHaveLength(1);
      expect(code.querySelector('[data-semantic-highlight="key"]')).toHaveTextContent(
        "socket.to(ROOM).emit('stroke', segment);",
      );
    }

    const handwritten = sample.columns[2];
    const code = columnView(dialog, handwritten.title).getByTestId(
      `snippet-code-${handwritten.snippet.id}`,
    );
    const related = [...code.querySelectorAll('[data-semantic-highlight="related"]')];
    expect(related[0]).toHaveTextContent('function createBroadcast(room, senderId)');
    expect(code.querySelector('[data-semantic-highlight="key"]')).toHaveTextContent(
      'if (id !== senderId)',
    );
    expect(code.querySelectorAll('[data-semantic-highlight]')).toHaveLength(5);
    expect(code.querySelector('[data-focus-line="true"]')).toHaveAttribute(
      'data-line',
      String(sample.handwritten.focusLineNumber),
    );
  });

  it('highlights acknowledgement and socket-id targeting correspondence for Chat', async () => {
    const { dialog, sample } = await openSample('chat');
    for (const column of sample.columns.slice(0, 2)) {
      const code = columnView(dialog, column.title).getByTestId(
        `snippet-code-${column.snippet.id}`,
      );
      const keys = [...code.querySelectorAll('[data-semantic-highlight="key"]')];
      expect(keys).toHaveLength(2);
      expect(keys[0]).toHaveTextContent('acknowledge(correct);');
      expect(keys[1]).toHaveTextContent("io.to(socket.id).emit('correct'");
    }

    const handwritten = sample.columns[2];
    const code = columnView(dialog, handwritten.title).getByTestId(
      `snippet-code-${handwritten.snippet.id}`,
    );
    const keys = [...code.querySelectorAll('[data-semantic-highlight="key"]')];
    expect(keys).toHaveLength(2);
    expect(keys[0]).toHaveTextContent('const ids = pairs.has(target)');
    expect(keys[1]).toHaveTextContent('dispatch(serverListeners, event, args);');
    expect(code.querySelector('[data-focus-line="true"]')).toHaveAttribute(
      'data-semantic-highlight',
      'key',
    );
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
});
