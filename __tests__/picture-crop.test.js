import { pictureCrop } from '../common/picture-crop.js';

describe('picture mask layout', () => {
  test('uses the visible ellipse dimensions, including an off-centre mask', () => {
    const crop = pictureCrop({
      clipPath: 'ellipse(31% 33% at 49.5% 51%)',
      size: { width: 1444, height: 1800 },
    });
    expect(crop.width).toBeCloseTo(895.28);
    expect(crop.height).toBeCloseTo(1188);
    // The original image, after scaling and translation, fills the crop box.
    const scale = parseFloat(crop.imageStyle.width) / 100;
    expect(scale * 0.62).toBeCloseTo(1);
    expect(parseFloat(crop.imageStyle.left) / 100 + scale * 0.185)
      .toBeCloseTo(0);
    expect(parseFloat(crop.imageStyle.top) / 100 + 0.18 / 0.66)
      .toBeCloseTo(0);
  });

  test.each([
    {},
    { clipPath: 'circle(40%)' },
    { clipPath: 'ellipse(0% 30% at 50% 50%)' },
    { clipPath: 'ellipse(40% 40% at 20% 50%)' },
  ])('leaves other or invalid mask layouts unchanged', attributes => {
    expect(pictureCrop({ ...attributes, size: { width: 800, height: 1000 } }))
      .toBeNull();
  });
});
