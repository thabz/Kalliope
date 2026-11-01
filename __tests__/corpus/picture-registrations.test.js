import path from 'path';
import { execFileSync } from 'child_process';
import { DOMParser } from '@xmldom/xmldom';
import { getElementsByTagName, loadXMLDoc } from '../../tools/build-static/xml.js';

// Match the image roots used by the work, artwork, keyword and about builders.
const imageRoot = filename => {
  if (filename.startsWith('fdirs/')) return `/images/${filename.split('/')[1]}`;
  if (filename.startsWith('content/keywords/')) return '/images/keywords';
  if (filename.startsWith('content/about/')) return '/images/about';
  return '/images';
};

const registrations = (document, filename) => {
  const artworkFile = path.posix.basename(filename) === 'artwork.xml';
  return getElementsByTagName(document, 'picture').flatMap((picture, index) => {
    if (['artwork', 'portrait', 'ref'].some(attr => picture.hasAttribute(attr))) return [];
    const src = artworkFile
      ? `${filename === 'content/artwork.xml' ? '/images/kunst' : imageRoot(filename)}/${picture.getAttribute('id')}.jpg`
      : picture.getAttribute('src');
    if (src == null || src.length === 0 || /^https?:\/\//.test(src)) return [];
    return [{
      src: path.posix.normalize(src.startsWith('/') ? src : `${imageRoot(filename)}/${src}`),
      location: `${filename}: picture #${index + 1}`,
    }];
  });
};

const duplicateRegistrations = entries => {
  const locations = new Map();
  for (const { src, location } of entries) {
    const found = locations.get(src) ?? [];
    found.push(location);
    locations.set(src, found);
  }
  return Array.from(locations, ([src, found]) => ({ src, locations: found }))
    .filter(entry => entry.locations.length > 1);
};

const parse = xml => new DOMParser().parseFromString(xml, 'text/xml');

describe('picture registrations', () => {
  it('reports every location, including duplicates within the same XML file', () => {
    const entries = registrations(parse('<pictures><picture src="p1.jpg"/><picture src="./p1.jpg"/><picture src="/images/test/p1.jpg"/></pictures>'), 'fdirs/test/1900.xml');
    expect(duplicateRegistrations(entries)).toEqual([{
      src: '/images/test/p1.jpg',
      locations: [1, 2, 3].map(index => `fdirs/test/1900.xml: picture #${index}`),
    }]);
  });

  it('includes implicit artwork paths and allows references and square sources', () => {
    const entries = [
      ...registrations(parse('<pictures><picture id="work"/></pictures>'), 'content/artwork.xml'),
      ...registrations(parse('<pictures><picture src="/images/kunst/work.jpg"/><picture artwork="kunst/work"/><picture portrait="test/p1"/><picture ref="kunst/work"/><picture src="p1.jpg" square-src="/images/kunst/work.jpg"/></pictures>'), 'fdirs/test/1900.xml'),
    ];
    expect(duplicateRegistrations(entries)).toEqual([{
      src: '/images/kunst/work.jpg',
      locations: ['content/artwork.xml: picture #1', 'fdirs/test/1900.xml: picture #1'],
    }]);
    expect(registrations(parse('<pictures><picture id="work"/></pictures>'), 'fdirs/artist/artwork.xml')[0].src).toBe('/images/artist/work.jpg');
  });

  it('distinguishes equal filenames in different directories', () => {
    const document = parse('<pictures><picture src="p1.jpg"/></pictures>');
    expect(duplicateRegistrations([
      ...registrations(document, 'fdirs/first/1900.xml'),
      ...registrations(document, 'fdirs/second/1900.xml'),
    ])).toEqual([]);
  });

  it('registers each local image file at most once across the corpus', () => {
    const filenames = execFileSync('git', ['ls-files', '-z', '--', 'fdirs/*.xml', 'content/*.xml'], { encoding: 'utf8' })
      .split('\0').filter(filename => filename.length > 0);
    expect(filenames.length).toBeGreaterThan(0);
    expect(duplicateRegistrations(filenames.flatMap(filename =>
      registrations(loadXMLDoc(filename), filename)))).toEqual([]);
  });
});
