import fs from 'fs';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const formatWithXmllint = xml =>
  execFileSync('xmllint', ['--format', '-'], {
    encoding: 'utf8',
    env: { ...process.env, XMLLINT_INDENT: '  ' },
    input: xml,
  });

const pictureStructuralTagPattern =
  /(<\/?(?:pictures|picture|picture-note|description)(?=\s|\/?>)[^>]*>)/g;

const isPictureStructuralTag = part =>
  /^<\/?(?:pictures|picture|picture-note|description)(?=\s|\/?>)/.test(part);

const normalizeTag = tag =>
  tag
    .replace(/\s*\r?\n\s*/g, ' ')
    .replace(/\s+\/>$/, '/>')
    .replace(/\s+>$/, '>');

const formatPicturesXml = xml => {
  const declaration = xml.match(/^\s*(<\?xml[^>]*\?>)/)?.[1];
  const body = declaration == null ? xml : xml.slice(xml.indexOf(declaration) + declaration.length);
  const lines = declaration == null ? [] : [declaration];
  let depth = 0;

  body.split(pictureStructuralTagPattern).forEach(part => {
    if (part.length === 0 || part.trim().length === 0) {
      return;
    }
    if (isPictureStructuralTag(part)) {
      const tag = normalizeTag(part.trim());
      if (tag.startsWith('</')) {
        depth = Math.max(0, depth - 1);
      }
      lines.push(`${'  '.repeat(depth)}${tag}`);
      if (tag.startsWith('</') === false && tag.endsWith('/>') === false) {
        depth += 1;
      }
      return;
    }
    const contentLines = part.trim().split(/\r?\n/).map(line => line.trim());
    contentLines.forEach(contentLine => {
      lines.push(contentLine.length === 0 ? '' : `${'  '.repeat(depth)}${contentLine}`);
    });
  });

  return `${lines.join('\n').trimEnd()}\n`;
};

export const formatMetadataXml = xml => {
  if (/<person(?:\s|>)/.test(xml)) {
    return formatWithXmllint(xml);
  }
  if (/<pictures(?:\s|>)/.test(xml)) {
    // Validate before applying the mixed-content-aware picture formatter.
    formatWithXmllint(xml);
    return formatPicturesXml(xml);
  }
  throw new Error('Ukendt metadata-XML: forventede <person> eller <pictures>');
};

const isMainModule = process.argv[1] != null &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  process.argv.slice(2).forEach(filename => {
    const xml = fs.readFileSync(filename, 'utf8');
    fs.writeFileSync(filename, formatMetadataXml(xml));
  });
}
