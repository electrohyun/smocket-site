import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Home from '../page';

const markup = renderToStaticMarkup(<Home />);

describe('interactive report landing page', () => {
  it('follows the product-to-use-to-report reading order', () => {
    const copy = [
      'Test Socket.IO behavior',
      'A one-client stub stops at the first room.',
      'One workflow, pinned and inspectable.',
      'Start with one existing test.',
      'Leave the client import where it is.',
      'Showcase 01 · Guess What',
      'Read the result, then inspect how it was made.',
      'What smocket does',
      'Take the next useful path.',
    ];

    let previous = -1;
    for (const text of copy) {
      const position = markup.indexOf(text);
      expect(position, `${text} should be rendered`).toBeGreaterThan(previous);
      previous = position;
    }
  });

  it('links the first showcase and measured report from the main flow', () => {
    expect(markup).toContain('aria-label="Report sections"');
    expect(markup).toContain('href="/demo"');
    expect(markup).toContain('href="/case-study"');
    expect(markup).toContain('href="#quickstart"');
    expect(markup).toContain('href="#evidence"');
  });

  it('shows exact recorded targets and a plain unmeasured state', () => {
    expect(markup).toContain('socket.io@4.8.3');
    expect(markup).toContain('smocket@0.4.2');
    expect(markup).toContain('Not measured yet');
    expect(markup).toContain('mock-socket');
    expect(markup).toContain('@mswjs/socket.io-binding');
    expect(markup).toContain('socket.io-mock');
    expect(markup).not.toContain('compatibility percentage');
  });

  it('states the application boundary without claiming a full drop-in replacement', () => {
    expect(markup).toContain('src/chat.ts · unchanged');
    expect(markup).toContain('vitest.config.ts · test-only switch');
    expect(markup).toContain('not presented as a complete drop-in replacement');
  });
});
