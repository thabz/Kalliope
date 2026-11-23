// A CSS clip path alone does not change an image's layout box.
export const pictureCrop = picture => {
  const ellipse = /^ellipse\(\s*([\d.]+)%\s+([\d.]+)%\s+at\s+([\d.]+)%\s+([\d.]+)%\s*\)$/u
    .exec(picture.clipPath ?? '');
  if (ellipse == null || picture.size == null) return null;
  const [rx, ry, cx, cy] = ellipse.slice(1).map(Number);
  if ([rx, ry, cx, cy].every(Number.isFinite) !== true ||
      rx <= 0 || ry <= 0 || cx - rx < 0 || cx + rx > 100 ||
      cy - ry < 0 || cy + ry > 100 ||
      picture.size.width <= 0 || picture.size.height <= 0) return null;

  const width = picture.size.width * rx / 50;
  const height = picture.size.height * ry / 50;
  return {
    width,
    height,
    frameStyle: {
      display: 'block',
      position: 'relative',
      aspectRatio: `${width} / ${height}`,
    },
    imageStyle: {
      position: 'absolute',
      width: `${5000 / rx}%`,
      height: 'auto',
      maxWidth: 'none',
      maxHeight: 'none',
      left: `${-(cx - rx) * 50 / rx}%`,
      top: `${-(cy - ry) * 50 / ry}%`,
    },
  };
};
