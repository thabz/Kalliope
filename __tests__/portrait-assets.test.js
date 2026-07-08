import fs from 'fs';
import path from 'path';

const imageExtensionPattern = /\.(jpe?g|png|gif|webp)$/i;
const pictureTagPattern = /<picture\b([^>]*)>/g;
const pictureAssetPattern = /\b(src|square-src)="([^"]+)"/g;

const walkFiles = dir => {
  const files = [];
  const visit = current => {
    fs.readdirSync(current, { withFileTypes: true }).forEach(entry => {
      const filename = path.join(current, entry.name);
      if (entry.isDirectory()) {
        visit(filename);
      } else if (entry.isFile()) {
        files.push(filename);
      }
    });
  };
  visit(dir);
  return files;
};

describe('portrait asset conventions', () => {
  it('keeps image files out of fdirs', () => {
    const imageFiles = walkFiles('fdirs').filter(filename =>
      imageExtensionPattern.test(filename)
    );

    expect(imageFiles).toEqual([]);
  });

  it('stores local portrait images under public/images/<poet-id>', () => {
    const missing = [];
    fs.readdirSync('fdirs', { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .forEach(poetId => {
        const portraitsFile = path.join('fdirs', poetId, 'portraits.xml');
        if (!fs.existsSync(portraitsFile)) {
          return;
        }

        const xml = fs.readFileSync(portraitsFile, 'utf8');
        Array.from(xml.matchAll(pictureTagPattern)).forEach(pictureMatch => {
          Array.from(pictureMatch[1].matchAll(pictureAssetPattern)).forEach(
            assetMatch => {
              const attrName = assetMatch[1];
              const value = assetMatch[2];
              if (value.startsWith('/')) {
                return;
              }

              const imagePath = path.join('public', 'images', poetId, value);
              if (!fs.existsSync(imagePath)) {
                missing.push(`${portraitsFile}: ${attrName}="${value}"`);
              }
            }
          );
        });
      });

    expect(missing).toEqual([]);
  });
});
