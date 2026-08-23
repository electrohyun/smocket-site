// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import TracePanel from '../TracePanel';
import { TraceStore } from '../../lib/trace';

afterEach(cleanup);

describe('delivery record scope', () => {
  it('marks the one-page record as all players', () => {
    render(<TracePanel store={new TraceStore()} />);

    expect(screen.getByLabelText('Delivery record')).toHaveTextContent('delivery (all)');
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('marks a scoped record as that player only', () => {
    render(<TracePanel store={new TraceStore()} scope="B" />);

    expect(screen.getByLabelText('Delivery record')).toHaveTextContent('delivery (only B)');
    expect(screen.getByRole('listitem')).toHaveTextContent('B');
  });
});
