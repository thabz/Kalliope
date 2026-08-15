import { poetImage, trimmedDescription } from '../common/opengraph.js';

describe('opengraph helpers', () => {
  it('trims rich content into a short description', () => {
    const description = trimmedDescription([
      ['<num>12</num><note>ignore me</note><p>Hej</p>', {}],
    ]);

    expect(description).toBe('Hej');
  });

  it('returns null for missing content', () => {
    expect(trimmedDescription(null)).toBeNull();
  });

  it('limits descriptions to 125 characters', () => {
    expect(trimmedDescription([['a'.repeat(200), {}]])).toHaveLength(125);
  });

  it('builds a poet image url when a square portrait exists', () => {
    expect(
      poetImage({
        id: 'aarestrup',
        has_square_portrait: true,
        square_portrait: 'portrait.jpg',
      })
    ).toBe('/images/aarestrup/portrait.jpg');
    expect(
      poetImage({
        id: 'aarestrup',
        has_square_portrait: false,
        square_portrait: 'portrait.jpg',
      })
    ).toBeNull();
  });
});
