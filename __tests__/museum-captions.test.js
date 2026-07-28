import fs from 'fs';
import path from 'path';

const picturePattern =
  /<picture\b[^>]*\bmuseum="([^"]+)"[^>]*>([\s\S]*?)<\/picture>/g;
const museumPattern =
  /<museum\b[^>]*\bid="([^"]+)"[^>]*>[\s\S]*?<name>([^<]+)<\/name>[\s\S]*?<\/museum>/g;

const walkXmlFiles = directory => {
  const files = [];
  const visit = current => {
    fs.readdirSync(current, { withFileTypes: true }).forEach(entry => {
      const filename = path.join(current, entry.name);
      if (entry.isDirectory()) {
        visit(filename);
      } else if (entry.isFile() && entry.name.endsWith('.xml')) {
        files.push(filename);
      }
    });
  };
  visit(directory);
  return files;
};

const normalizeText = value =>
  value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('da');

describe('museum captions', () => {
  it('derives museum names from metadata instead of descriptions', () => {
    const museumsXml = fs.readFileSync('content/museums.xml', 'utf8');
    const museumNames = new Map(
      Array.from(museumsXml.matchAll(museumPattern)).map(match => [
        match[1],
        normalizeText(match[2]),
      ])
    );
    const duplicates = [];

    ['content', 'fdirs']
      .flatMap(walkXmlFiles)
      .forEach(filename => {
        const xml = fs.readFileSync(filename, 'utf8');
        Array.from(xml.matchAll(picturePattern)).forEach(match => {
          const museumId = match[1];
          const museumName = museumNames.get(museumId);
          if (museumName == null || museumName.length < 6) {
            return;
          }
          const description = normalizeText(match[2]);
          if (description.includes(museumName)) {
            duplicates.push(`${filename}: museum="${museumId}"`);
          }
        });
      });

    expect(duplicates).toEqual([]);
  });
});
