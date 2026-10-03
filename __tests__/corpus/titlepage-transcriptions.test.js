import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DOMParser } from '@xmldom/xmldom';
import { FigCaption } from '../../components/picture.js';
import { get_local_picture_content } from '../../tools/build-static/parsing.js';
import { loadTrackedWorkFiles } from '../../tools/libs/work-files.js';

const parse = xml => new DOMParser().parseFromString(xml, 'text/xml');
const directChildren = (element, name) => Array.from(element.childNodes).filter(
  child => child.nodeType === 1 && child.nodeName === name,
);

const titlepageIssues = (filename, document) => {
  const issues = [];
  Array.from(document.getElementsByTagName('picture'))
    .filter(picture => picture.getAttribute('type') === 'titlepage')
    .forEach(picture => {
      const label = picture.getAttribute('src') ?? '(uden src)';
      const transcriptions = directChildren(picture, 'transcription');
      if (transcriptions.length !== 1 ||
          transcriptions[0].textContent.trim().length === 0) {
        issues.push(`${filename}: ${label}: kræver én ikke-tom <transcription>`);
      }
    });
  return issues;
};

describe('titelbladstransskriptioner', () => {
  it('requires a nonempty transcription for each title page', () => {
    const document = parse(`
      <workhead><pictures>
        <picture type="titlepage" src="empty.jpg"/>
        <picture type="titlepage" src="blank.jpg"><transcription> </transcription></picture>
        <picture type="titlepage" src="ok.jpg"><transcription>Titel / Forfatter</transcription></picture>
        <picture type="frontpage" src="cover.jpg"/>
      </pictures></workhead>
    `);
    expect(titlepageIssues('work.xml', document)).toEqual([
      'work.xml: empty.jpg: kræver én ikke-tom <transcription>',
      'work.xml: blank.jpg: kræver én ikke-tom <transcription>',
    ]);
  });

  it('keeps transcription separate from the picture caption', () => {
    const picture = parse('<picture type="titlepage" src="p1.jpg">' +
      '<transcription>Titel / Forfatter</transcription></picture>').documentElement;
    expect(get_local_picture_content(picture).description).toBe('');
    const withCaption = parse('<picture type="titlepage" src="p1.jpg">' +
      'Forklaring.<transcription>Titel / Forfatter</transcription></picture>')
      .documentElement;
    expect(get_local_picture_content(withCaption).description).toBe('Forklaring.');
    const html = renderToStaticMarkup(<FigCaption picture={{
      content_html: '',
      transcription: 'Titel / Forfatter',
    }} />);
    expect(html).toContain('Titel / Forfatter');
    expect(html).not.toContain('<div></div>');
  });

  it('checks every tracked work with a title-page picture', () => {
    const works = loadTrackedWorkFiles();
    const issues = works.flatMap(({ filename, content }) =>
      titlepageIssues(filename, parse(content)));
    expect(works.length).toBeGreaterThan(0);
    expect(issues).toEqual([]);
  });
});
