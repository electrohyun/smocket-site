// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import observations from '../../../content/case-study-observations.json';
import ApproachEvidence from '../components/ApproachEvidence';
import BehaviorMatrix from '../components/BehaviorMatrix';
import ObservationExplorer from '../components/ObservationExplorer';
import { createCaseStudyModel } from '../lib/model';
import { loadCaseStudySources } from '../lib/source-evidence';

const model = createCaseStudyModel(observations, loadCaseStudySources());

afterEach(cleanup);

describe('case study DOM interactions', () => {
  it('changes real target setup, files, source, and boundaries with click and keyboard', async () => {
    const user = userEvent.setup();
    render(<ApproachEvidence model={model} />);

    const real = screen.getByRole('button', { name: 'Select Real Socket.IO evidence' });
    const smocket = screen.getByRole('button', { name: 'Select Exact published Smocket evidence' });
    const handwritten = screen.getByRole('button', { name: 'Select Handwritten mock evidence' });

    expect(real).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Real Socket.IO bootstrap')).toBeInTheDocument();
    expect(screen.getByText(/createServer/, { selector: 'code' })).toBeInTheDocument();

    await user.click(smocket);
    expect(smocket).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('smocket@0.4.2')).toBeInTheDocument();
    expect(screen.getByText('Published Smocket bootstrap')).toBeInTheDocument();

    handwritten.focus();
    await user.keyboard('{Enter}');
    expect(handwritten).toHaveFocus();
    expect(handwritten).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByText('handwritten-socket-io.js', { exact: false }).length).toBeGreaterThan(0);
    expect(screen.getByText('Namespaces')).toBeInTheDocument();
    expect(screen.getByText('Room membership and joins')).toBeInTheDocument();

    const routing = screen.getByRole('button', { name: 'Room routing and sender exclusion' });
    routing.focus();
    await user.keyboard(' ');
    expect(routing).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/excludedSocketIds/, { selector: 'code' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open pinned source ↗' })).toHaveAttribute(
      'href',
      expect.stringContaining('fa90e07e272c7fd0db64ebfd73cbb104664ddb81'),
    );
  });

  it('opens behavior-specific structured, assertion, application, and mock evidence', async () => {
    const user = userEvent.setup();
    render(<BehaviorMatrix model={model} />);

    const join = screen.getByRole('button', { name: 'Acknowledged joins' });
    const authorization = screen.getByRole('button', { name: 'Authorization rejection' });
    expect(join).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/"participantId": "alice"/, { selector: 'code' })).toBeInTheDocument();

    await user.click(authorization);
    expect(authorization).toHaveAttribute('aria-pressed', 'true');
    const panel = document.getElementById('behavior-evidence')!;
    expect(within(panel).getByText(/"reason": "moderator-only"/, { selector: 'code' })).toBeInTheDocument();
    expect(within(panel).getByText(/moderator-announcement/, { selector: 'code' })).toBeInTheDocument();
    expect(within(panel).getByText('Acknowledgements')).toBeInTheDocument();

    const disconnect = screen.getByRole('button', { name: 'Disconnect notification' });
    disconnect.focus();
    await user.keyboard('{Enter}');
    expect(disconnect).toHaveFocus();
    expect(disconnect).toHaveAttribute('aria-pressed', 'true');
    expect(within(panel).getAllByText(/disconnecting/, { selector: 'code' })).toHaveLength(2);
  });

  it('uses a keyboard-reachable disclosure and filters the shared transcript without a target control', async () => {
    const user = userEvent.setup();
    render(<ObservationExplorer model={model} />);

    expect(screen.queryByText('Inspect Real Socket.IO')).not.toBeInTheDocument();
    const summary = screen.getByText('Supporting evidence: shared transcript', { exact: false });
    const details = summary.closest('details')!;
    expect(details).not.toHaveAttribute('open');

    summary.focus();
    await user.keyboard('{Enter}');
    expect(summary).toHaveFocus();
    expect(details).toHaveAttribute('open');

    await user.click(screen.getByRole('button', { name: 'Carol' }));
    await user.click(screen.getByRole('button', { name: /^Message$/ }));
    expect(screen.getByText('No recorded line matches both filters.')).toBeInTheDocument();

    const reset = screen.getByRole('button', { name: 'Show all transcript lines' });
    reset.focus();
    await user.keyboard(' ');
    expect(screen.getByText('Showing 10 of 10 shared lines.')).toBeInTheDocument();
    expect(screen.getByText('[alice] Welcome to #general.')).toBeInTheDocument();
  });

  it('places focus through the primary approach controls in document order', async () => {
    const user = userEvent.setup();
    render(<ApproachEvidence model={model} />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Select Real Socket.IO evidence' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Select Exact published Smocket evidence' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Select Handwritten mock evidence' })).toHaveFocus();
  });
});
