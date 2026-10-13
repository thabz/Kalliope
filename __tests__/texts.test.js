import { groupLines } from '../pages/texts.js';

describe('poet text lists', () => {
  const roseLines = [
    { id: 'rose-old-castle', title: 'Rosen', firstline: 'Ved gamle Borg' },
    { id: 'rose-trees', title: 'Rosentræerne', firstline: 'Rosentræerne blomstre' },
    { id: 'rose-beautiful', title: 'Rosen', firstline: 'Du var langt mere skiøn og huld' },
  ];

  it('keeps identical titles together before longer titles', () => {
    const groups = groupLines(roseLines.map(line => ({ ...line })), 'titles', 'da');

    expect(groups.map(group => group.title)).toEqual(['R']);
    expect(groups[0].items.map(line => line.id)).toEqual([
      'rose-beautiful',
      'rose-old-castle',
      'rose-trees',
    ]);
  });

  it('sorts first lines before using titles to distinguish identical lines', () => {
    const lines = roseLines.map(line => ({
      id: line.id,
      title: line.firstline,
      firstline: line.title,
    }));
    const groups = groupLines(lines, 'firstlines', 'da');

    expect(groups[0].items.map(line => line.id)).toEqual([
      'rose-beautiful',
      'rose-old-castle',
      'rose-trees',
    ]);
  });

  it('uses ids only after both displayed lines compare equally', () => {
    const lines = [
      { id: 'a', title: 'Rosen', firstline: 'Blomsten A' },
      { id: 'z', title: 'Rosen', firstline: 'Blomsten' },
      { id: 'b', title: 'Rosen', firstline: 'Blomsten' },
    ];
    const groups = groupLines(lines, 'titles', 'da');

    expect(groups[0].items.map(line => line.id)).toEqual(['b', 'z', 'a']);
  });
});
