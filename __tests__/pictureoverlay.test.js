import { isOvalPicture, ovalIconCenter } from '../components/pictureoverlay.js';

const navigationControlCount = 4;

describe('picture overlay controls', () => {
  test('recognizes pictures using the existing oval filename convention', () => {
    expect(isOvalPicture({ src: '/images/juel/struensee-1771-oval.jpg' })).toBe(
      true
    );
    expect(isOvalPicture({ src: '/images/juel/struensee-1771.jpg' })).toBe(
      false
    );
  });

  test('places every control center on the edge of the ellipse', () => {
    for (let index = 0; index < navigationControlCount; index += 1) {
      const center = ovalIconCenter(index);
      const ellipseValue =
        ((center.left - 50) / 50) ** 2 + ((center.top - 50) / 50) ** 2;

      expect(ellipseValue).toBeCloseTo(1, 3);
    }
  });

  test('orders four controls down the upper-right curve', () => {
    for (let index = 1; index < navigationControlCount; index += 1) {
      const previousCenter = ovalIconCenter(index - 1);
      const center = ovalIconCenter(index);
      expect(center.left).toBeGreaterThan(previousCenter.left);
      expect(center.top).toBeGreaterThan(previousCenter.top);
    }
  });
});
