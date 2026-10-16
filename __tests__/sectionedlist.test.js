import { sectionColumnSplitIndex } from '../components/sectionedlist.js';

const sectionsWithCounts = (counts) =>
  counts.map((count) => ({ items: Array.from({ length: count }) }));

describe('sectioned list columns', () => {
  it('keeps empty lists and single sections in the first column', () => {
    expect(sectionColumnSplitIndex([])).toBe(0);
    expect(sectionColumnSplitIndex(sectionsWithCounts([100]))).toBe(1);
  });

  it('balances equal sections without changing their order', () => {
    expect(sectionColumnSplitIndex(sectionsWithCounts([10, 10, 10, 10]))).toBe(2);
  });

  it('balances unequal sections at a section boundary', () => {
    expect(sectionColumnSplitIndex(sectionsWithCounts([5, 1, 1, 1]))).toBe(1);
    expect(sectionColumnSplitIndex(sectionsWithCounts([1, 1, 1, 5]))).toBe(3);
  });

  it('allows for headings when balancing short sections', () => {
    expect(sectionColumnSplitIndex(sectionsWithCounts([0, 0, 3]))).toBe(2);
  });
});
