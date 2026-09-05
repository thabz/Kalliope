import { blocksHaveMarginNotes } from '../pages/text.js';

describe('text page blocks', () => {
  it('accepts linkable sections without text blocks', () => {
    expect(blocksHaveMarginNotes(null)).toBe(false);
  });

  it('detects margin notes in text blocks', () => {
    const blocks = [
      {
        lines: [['En linje <margin>med en note</margin>.']],
      },
    ];

    expect(blocksHaveMarginNotes(blocks)).toBe(true);
  });
});
