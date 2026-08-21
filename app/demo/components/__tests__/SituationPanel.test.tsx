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
        name: `Source at ${drawingGameCodeModel.publicationCommit.slice(0, 7)}`,
      }),
    ).toHaveAttribute('href', column.snippet.sourceUrl);
  }
}

describe('SituationPanel code dialog', () => {
  it('shows the fixed Drawing comparison with canonical code and measured scope', async () => {
    const { dialog, sample } = await openSample('drawing');
    expectFixedColumns(dialog, 'drawing');

    expect(sample.columns.map(({ snippet }) => snippet.id)).toEqual([
      'real.3-sender-excluded-stroke',
      'smocket.3-sender-excluded-stroke',
      'handwritten.sender-exclusion.source.transport',
    ]);
    expect(columnView(dialog, 'Real Socket.IO').getByText('ORACLE')).toBeInTheDocument();
    expect(columnView(dialog, 'Smocket').getByText('MATCH')).toBeInTheDocument();
    expect(columnView(dialog, 'Smocket').getByText('Same handler')).toBeInTheDocument();
    expect(
      columnView(dialog, 'Smocket').getByText('Application code changed: 0 LOC'),
    ).toBeInTheDocument();
    expect(
      columnView(dialog, 'Handwritten mock').getByText('55 LOC capability stage'),
    ).toBeInTheDocument();
  });

  it('shows the fixed Chat comparison with canonical code and measured scope', async () => {
    const { dialog, sample } = await openSample('chat');
    expectFixedColumns(dialog, 'chat');

    expect(sample.columns.map(({ snippet }) => snippet.id)).toEqual([
      'real.5-correct-guess',
      'smocket.5-correct-guess',
      'handwritten.targeted-delivery.source.transport',
    ]);
    expect(columnView(dialog, 'Real Socket.IO').getByText('ORACLE')).toBeInTheDocument();
    expect(columnView(dialog, 'Smocket').getByText('MATCH')).toBeInTheDocument();
    expect(
      columnView(dialog, 'Handwritten mock').getByText('56 LOC capability stage'),
    ).toBeInTheDocument();
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

  it('reads Smocket integration measurements without exposing loader source', async () => {
    const { dialog } = await openSample('drawing');
    const card = columnView(dialog, 'Smocket');

    expect(card.getByText('18 LOC')).toBeInTheDocument();
    expect(card.getByText('6 LOC')).toBeInTheDocument();
    expect(card.getByText('10 LOC')).toBeInTheDocument();
    expect(card.getByText('2 LOC')).toBeInTheDocument();
    expect(card.getByText('Package-owned')).toBeInTheDocument();
    const metrics = card.getByText('Measured source total').closest('dl');
    expect(metrics).not.toBeNull();
    expect([...metrics!.querySelectorAll(':scope > div')].map((row) => row.textContent)).toEqual([
      'Measured source total18 LOC',
      'Transport implementationPackage-owned',
      'Application bootstrap6 LOC',
      'Client substitution10 LOC',
      'Loader registration2 LOC',
    ]);
    expect(dialog).not.toHaveTextContent('smocket-client-substitution');
    expect(dialog).not.toHaveTextContent('register-loader');
  });

  it.each([
    [
      'drawing',
      [
        'Measured source total55 LOC',
        'Transport implementationApplication-owned',
        'room broadcast53 LOC',
        'sender exclusion55 LOC',
        'full workflow140 LOC',
      ],
    ],
    [
      'chat',
      [
        'Measured source total56 LOC',
        'Transport implementationApplication-owned',
        'acknowledgement55 LOC',
        'targeted delivery56 LOC',
        'full workflow140 LOC',
      ],
    ],
  ] as const)('lists the compact Handwritten LOC comparison for %s', async (sampleId, expected) => {
    const { dialog, sample } = await openSample(sampleId);
    const card = columnView(dialog, 'Handwritten mock');
    const metrics = card.getByLabelText('Handwritten LOC by stage');
    const article = metrics.closest('article');

    expect(within(metrics).getAllByRole('term')).toHaveLength(5);
    expect([...metrics.querySelectorAll(':scope > div')].map((row) => row.textContent)).toEqual(
      expected,
    );
    expect(article).not.toHaveTextContent(sample.handwritten.supportDescription);
    expect(card.queryByLabelText('Measured stage changes')).not.toBeInTheDocument();
    expect(article).not.toHaveTextContent('not the full golden workflow');
  });

  it.each<CodeSampleId>(['drawing', 'chat'])(
    'highlights only artifact-derived %s Handwritten lines',
    async (sampleId) => {
      const { dialog, sample } = await openSample(sampleId);
      const handwritten = sample.columns[2];
      const card = columnView(dialog, handwritten.title);
      const highlighted = card
        .getByTestId(`snippet-code-${handwritten.snippet.id}`)
        .querySelectorAll('[data-highlighted="true"]');

      expect(highlighted.length).toBeGreaterThan(0);
      expect([...highlighted].map((line) => Number(line.getAttribute('data-line')))).toEqual(
        handwritten.lines.filter((line) => line.highlighted).map((line) => line.lineNumber),
      );
    },
  );

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
