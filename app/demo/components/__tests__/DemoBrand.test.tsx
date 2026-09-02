import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import DemoBrand from '../DemoBrand';

describe('DemoBrand', () => {
  it('links the shared demo brand to the home page', () => {
    const markup = renderToStaticMarkup(<DemoBrand />);

    expect(markup).toContain('href="/"');
    expect(markup).toContain('aria-label="Smocket home"');
  });
});
