import {
  calculateOvalIconPositions,
  isOvalPicture,
} from '../components/pictureoverlay.js';

const iconCenter = (position) => {
  return {
    x: position.left + 15,
    y: position.top + 15,
  };
};

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
    const width = 600;
    const height = 800;
    const positions = calculateOvalIconPositions(width, height, 4);

    positions.forEach((position) => {
      const center = iconCenter(position);
      const ellipseValue =
        ((center.x - width / 2) / (width / 2)) ** 2 +
        ((center.y - height / 2) / (height / 2)) ** 2;

      expect(ellipseValue).toBeCloseTo(1);
    });
  });

  test('keeps the controls 35 pixels apart vertically along the curve', () => {
    const positions = calculateOvalIconPositions(600, 800, 4);
    const centers = positions.map(iconCenter);

    expect(centers[0].y).toBe(64);
    expect(centers[1].y - centers[0].y).toBe(35);
    expect(centers[2].y - centers[1].y).toBe(35);
    expect(centers[3].y - centers[2].y).toBe(35);
  });
});
