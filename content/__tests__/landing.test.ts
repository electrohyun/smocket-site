import { describe, expect, it } from 'vitest';
import { footer, hero } from '../landing';

describe('landing publication links', () => {
  it('shows the current release and routes footer readers to the docs proxy', () => {
    expect(hero.chips).toContain('v0.5.1');
    expect(hero.chips).not.toContain('v0.4.1');
    expect(footer.links).toContainEqual({ label: 'Docs', href: '/docs', todo: null });
  });
});
