import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const iconDirectory = 'public/images/about/kalliope-days';
const borderWidth = 8;
const minimumWhiteChannel = 245;
const maximumChannelDifference = 5;

const iconFiles = fs
  .readdirSync(iconDirectory)
  .filter(filename => filename.endsWith('.jpg'))
  .sort();

describe('Kalliope-ikonernes baggrund', () => {
  test('finder dagsikoner', () => {
    expect(iconFiles.length).toBeGreaterThan(0);
  });

  test.each(iconFiles)('%s har hvid baggrund langs billedkanten', async file => {
    const filename = path.join(iconDirectory, file);
    const { data, info } = await sharp(filename)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const nonWhitePixels = [];

    for (let y = 0; y < info.height; y += 1) {
      for (let x = 0; x < info.width; x += 1) {
        const isBorderPixel =
          x < borderWidth ||
          x >= info.width - borderWidth ||
          y < borderWidth ||
          y >= info.height - borderWidth;

        if (isBorderPixel === false) {
          continue;
        }

        const offset = (y * info.width + x) * info.channels;
        const channels = [
          data[offset],
          data[offset + 1],
          data[offset + 2],
        ];
        const darkestChannel = Math.min(...channels);
        const channelDifference =
          Math.max(...channels) - Math.min(...channels);
        const isWhite =
          darkestChannel >= minimumWhiteChannel &&
          channelDifference <= maximumChannelDifference;

        if (isWhite === false && nonWhitePixels.length < 10) {
          nonWhitePixels.push({ x, y, channels });
        }
      }
    }

    expect(nonWhitePixels).toEqual([]);
  });
});
