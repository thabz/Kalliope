import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { DOMParser, onWarningStopParsing } from '@xmldom/xmldom';

const git = (args, options = {}) => execFileSync('git', args, {
  encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, ...options,
});

const imageRoot = filename => {
  if (filename === 'content/events.xml' || /^fdirs\/[^/]+\/events\.xml$/.test(filename)) return '';
  if (filename.startsWith('fdirs/')) return `/images/${filename.split('/')[1]}`;
  if (filename.startsWith('content/keywords/')) return '/images/keywords';
  if (filename.startsWith('content/about/')) return '/images/about';
  return '/images';
};

const validDate = value => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value) !== true) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) !== true && date.toISOString().slice(0, 10) === value;
};

const checkedComment = picture => {
  const comments = [];
  const visit = node => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === 8) comments.push(child.data);
      // A nested picture's attestation belongs only to that picture.
      if (child.nodeType === 1 && child.tagName !== 'picture') visit(child);
    }
  };
  visit(picture);
  let next = picture.nextSibling;
  while (next != null && next.nodeType === 3 && next.data.trim() === '') next = next.nextSibling;
  if (next != null && next.nodeType === 8) comments.push(next.data);
  return comments.some(comment => {
    const match = comment.trim().match(/^metadata checked: (\d{4}-\d{2}-\d{2})$/);
    return match != null && validDate(match[1]);
  });
};

export const pictureRegistrations = (xml, filename) => {
  let document;
  try {
    document = new DOMParser({ onError: onWarningStopParsing }).parseFromString(xml, 'text/xml');
  } catch (error) {
    throw new Error(`${filename}: ${error.message}`);
  }
  return Array.from(document.getElementsByTagName('picture')).flatMap((picture, index) => {
    const artworkFile = path.posix.basename(filename) === 'artwork.xml';
    // Like the builders, prefer a direct source over any reference attributes.
    const src = artworkFile
      ? `${filename === 'content/artwork.xml' ? '/images/kunst' : imageRoot(filename)}/${picture.getAttribute('id')}.jpg`
      : picture.getAttribute('src');
    if (src == null || src.length === 0) return [];
    const asset = /^https?:\/\//.test(src)
      ? src
      : path.posix.normalize(src.startsWith('/') ? src : `${imageRoot(filename)}/${src}`);
    return [{
      asset,
      location: `${filename}:${picture.lineNumber ?? '?'} (picture #${index + 1}, ${src})`,
      checked: checkedComment(picture),
      exempt: ['titlepage', 'score'].includes(picture.getAttribute('type')),
    }];
  });
};

// Read snapshots in one Git process; no checkout or working-tree files are changed.
const registrationsAtRef = ref => {
  git(['rev-parse', '--verify', `${ref}^{commit}`]);
  const filenames = git(['ls-tree', '-r', '--name-only', '-z', ref, '--', 'fdirs', 'content'])
    .split('\0').filter(filename => filename.endsWith('.xml'));
  if (filenames.length === 0) return [];
  const output = git(['cat-file', '--batch'], {
    encoding: null, input: filenames.map(filename => `${ref}:${filename}\n`).join(''),
  });
  let offset = 0;
  return filenames.flatMap(filename => {
    const headerEnd = output.indexOf(10, offset);
    const header = output.subarray(offset, headerEnd).toString('utf8');
    const match = header.match(/^[0-9a-f]+ blob (\d+)$/);
    if (headerEnd < 0 || match == null) throw new Error(`Git kunne ikke læse ${ref}:${filename}.`);
    const start = headerEnd + 1;
    offset = start + Number(match[1]) + 1;
    const xml = output.subarray(start, offset - 1).toString('utf8');
    // Only picture-bearing source XML needs parsing, not the entire text corpus.
    return /<picture[\s/>]/.test(xml) ? pictureRegistrations(xml, filename) : [];
  });
};

export const newPictureErrors = (base, head, renames = new Map()) => {
  const remaining = new Map();
  base.forEach(entry => {
    const asset = renames.get(entry.asset) ?? entry.asset;
    remaining.set(asset, (remaining.get(asset) ?? 0) + 1);
  });
  const errors = [];
  let newCount = 0;
  head.forEach(entry => {
    const count = remaining.get(entry.asset) ?? 0;
    if (count > 0) {
      remaining.set(entry.asset, count - 1);
      return;
    }
    if (entry.exempt === true) return;
    newCount += 1;
    if (entry.checked !== true) {
      errors.push(`${entry.location}: Nyt billede mangler <!-- metadata checked: YYYY-MM-DD --> med gyldig dato. Gennemgå kilder og metadata før markering.`);
    }
  });
  return { errors, newCount };
};

export const validateRefs = (baseRef, headRef = 'HEAD') => {
  const base = registrationsAtRef(baseRef);
  const head = registrationsAtRef(headRef);
  const changes = git(['diff', '--name-status', '-z', '-M', baseRef, headRef, '--', 'public/images']).split('\0');
  const renames = new Map();
  for (let i = 0; i < changes.length && changes[i].length > 0;) {
    const status = changes[i++];
    const from = changes[i++];
    if (status.startsWith('R')) {
      const to = changes[i++];
      renames.set(`/${from.slice('public/'.length)}`, `/${to.slice('public/'.length)}`);
    }
  }
  return newPictureErrors(base, head, renames);
};

if (process.argv[1] != null && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [baseRef, headRef = 'HEAD'] = process.argv.slice(2);
  try {
    if (baseRef == null) throw new Error('Brug: node tools/validate-new-picture-metadata.js BASE-REF [HEAD-REF]');
    const result = validateRefs(baseRef, headRef);
    if (result.errors.length > 0) {
      result.errors.forEach(error => console.error(error));
      process.exitCode = 1;
    } else {
      console.log(`Validerede metadata-markering for ${result.newCount} nye billeder.`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
