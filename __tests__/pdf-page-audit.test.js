import { parseSimplePages } from '../.codex/skills/pdf-to-kalliope/scripts/audit-utils.js';

describe('PDF page audit helpers', () => {
  it('preserves a non-canonical printed Roman endpoint', () => {
    const interval = parseSimplePages('I-XLIIII');

    expect(interval.label(43)).toBe('XLIII');
    expect(interval.label(44)).toBe('XLIIII');
  });

});
