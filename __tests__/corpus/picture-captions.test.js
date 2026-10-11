import { execFileSync } from 'child_process';
import { DOMParser } from '@xmldom/xmldom';
import { getChildByTagName, getElementsByTagName, loadXMLDoc } from '../../tools/build-static/xml.js';

const ignoredCaptionElements = new Set(['identifiers', 'picture-note']);
const normalizeText = value => value.replace(/\s+/g, ' ').trim();

const captionText = (node, omittedTitle = null) => {
  if (node.nodeType === 3 || node.nodeType === 4) {
    return node.nodeValue;
  }
  if (node.nodeType !== 1 || ignoredCaptionElements.has(node.nodeName)) {
    return '';
  }
  if (
    node.nodeName === 'i' &&
    omittedTitle != null &&
    normalizeText(node.textContent).toLowerCase() === omittedTitle.toLowerCase()
  ) {
    return ' ';
  }
  return Array.from(node.childNodes).map(child => captionText(child, omittedTitle)).join('');
};

const visibleCaption = (picture, omittedTitle = null) => {
  const description = getChildByTagName(picture, 'description');
  return normalizeText(captionText(description ?? picture, omittedTitle));
};

const containsIdentifier = (caption, identifier) => {
  const escaped = normalizeText(identifier).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (escaped.length === 0) {
    return false;
  }
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`, 'iu')
    .test(caption);
};

const museumNames = document => new Map(
  getElementsByTagName(document, 'museum').map(museum => [
    museum.getAttribute('id'),
    normalizeText(getChildByTagName(museum, 'name')?.textContent ?? ''),
  ]),
);

const pictureCaptionIssues = (document, names, filename) => {
  const issues = [];
  getElementsByTagName(document, 'picture').forEach((picture, index) => {
    const museumId = picture.getAttribute('museum');
    const museumName = names.get(museumId);
    const caption = visibleCaption(picture);
    const label = picture.getAttribute('id') ?? picture.getAttribute('src') ?? `picture #${index + 1}`;

    if (museumName != null && museumName.length > 0 &&
        caption.toLowerCase().includes(museumName.toLowerCase())) {
      issues.push(`${filename}: ${label}: billedteksten gentager museet ${museumName}`);
    }

    for (const attribute of ['objid', 'invnr']) {
      const value = picture.getAttribute(attribute);
      if (value == null) {
        continue;
      }
      // A museum may use the artwork title as objid; the title is still caption content.
      const omittedTitle = attribute === 'objid' && /\p{L}/u.test(value)
        ? normalizeText(value)
        : null;
      if (containsIdentifier(visibleCaption(picture, omittedTitle), value)) {
        issues.push(`${filename}: ${label}: billedteksten gentager ${attribute}="${value}"`);
      }
    }
  });
  return issues;
};

describe('picture captions', () => {
  const parse = xml => new DOMParser().parseFromString(xml, 'text/xml');
  const names = new Map([['smk', 'Statens Museum for Kunst']]);

  it('finds repeated museum names and both picture identifiers', () => {
    const document = parse(`
      <pictures>
        <picture id="first" museum="smk" objid="123" invnr="KKS12135">
          <description>Portrait. Statens Museum for Kunst, 123, KKS12135.</description>
          <picture-note>Internal note.</picture-note>
        </picture>
      </pictures>
    `);

    expect(pictureCaptionIssues(document, names, 'pictures.xml')).toEqual([
      'pictures.xml: first: billedteksten gentager museet Statens Museum for Kunst',
      'pictures.xml: first: billedteksten gentager objid="123"',
      'pictures.xml: first: billedteksten gentager invnr="KKS12135"',
    ]);
  });

  it('checks direct caption text and catches an objid repeated outside its title', () => {
    const document = parse(`
      <pictures>
        <picture src="portrait.jpg" museum="smk" objid="The Doctor's Visit">
          <i>The Doctor's Visit</i>. Catalogue: The Doctor's Visit.
        </picture>
      </pictures>
    `);

    expect(pictureCaptionIssues(document, names, 'pictures.xml')).toEqual([
      'pictures.xml: portrait.jpg: billedteksten gentager objid="The Doctor\'s Visit"',
    ]);
  });

  it('ignores metadata, comments, partial numbers, and a title used as objid', () => {
    const document = parse(`
      <pictures>
        <picture museum="smk" objid="The Doctor's Visit" invnr="123">
          <description><i>The Doctor's Visit</i>, 1234.</description>
          <picture-note>Statens Museum for Kunst, 123.</picture-note>
          <identifiers><wikidata>Q123</wikidata></identifiers>
          <!-- Statens Museum for Kunst, 123. -->
        </picture>
      </pictures>
    `);

    expect(pictureCaptionIssues(document, names, 'pictures.xml')).toEqual([]);
  });

  it('checks every tracked XML picture against museum metadata', () => {
    const names = museumNames(loadXMLDoc('content/museums.xml'));
    const filenames = execFileSync(
      'git', ['grep', '-l', '-e', '<picture', '--', '*.xml'], { encoding: 'utf8' },
    ).trim().split('\n').filter(filename => filename.length > 0);
    const issues = filenames.flatMap(filename =>
      pictureCaptionIssues(loadXMLDoc(filename), names, filename));

    expect(filenames.length).toBeGreaterThan(0);
    expect(issues).toEqual([]);
  });
});
