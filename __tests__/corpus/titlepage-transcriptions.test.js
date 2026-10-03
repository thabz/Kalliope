import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DOMParser } from '@xmldom/xmldom';
import { FigCaption } from '../../components/picture.js';
import { titlepagePictures } from '../../components/sidebarpictures.js';
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
        return;
      }
      const value = transcriptions[0].textContent;
      if (/[\t\n]/.test(value)) {
        issues.push(`${filename}: ${label}: <transcription> må ikke indeholde tabulatorer eller linjeskift`);
      }
      if (value !== value.trim()) {
        issues.push(`${filename}: ${label}: <transcription> må ikke have indledende eller afsluttende whitespace`);
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

  it('rejects tabs, newlines, and surrounding whitespace', () => {
    const document = parse('<workhead><pictures>' +
      '<picture type="titlepage" src="tab.jpg"><transcription>Titel\t/ Forfatter</transcription></picture>' +
      '<picture type="titlepage" src="newline.jpg"><transcription>Titel\n/ Forfatter</transcription></picture>' +
      '<picture type="titlepage" src="leading.jpg"><transcription> Titel / Forfatter</transcription></picture>' +
      '<picture type="titlepage" src="trailing.jpg"><transcription>Titel / Forfatter </transcription></picture>' +
      '</pictures></workhead>');
    expect(titlepageIssues('work.xml', document)).toEqual([
      'work.xml: tab.jpg: <transcription> må ikke indeholde tabulatorer eller linjeskift',
      'work.xml: newline.jpg: <transcription> må ikke indeholde tabulatorer eller linjeskift',
      'work.xml: leading.jpg: <transcription> må ikke have indledende eller afsluttende whitespace',
      'work.xml: trailing.jpg: <transcription> må ikke have indledende eller afsluttende whitespace',
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

  it('renders the work title, year, and title-page wording as one sentence', () => {
    const [picture] = titlepagePictures([{
      content_html: '',
      transcription: 'Torquato Tasso: / Det befriede Jerusalem. // Paa Dansk / ved / Christine Daugaard. // Kjøbenhavn. / Karl Schønbergs Forlag. / Trykt hos Nielsen & Lydiche. / 1884.',
    }], { title: 'Det befriede Jerusalem', year: '1884' });
    const caption = parse(renderToStaticMarkup(<FigCaption picture={picture} />));
    expect(caption.documentElement.textContent).toBe(
      "Titelbladet til Det befriede Jerusalem (1884) lyder ,,Torquato Tasso: / Det befriede Jerusalem. // Paa Dansk / ved / Christine Daugaard. // Kjøbenhavn. / Karl Schønbergs Forlag. / Trykt hos Nielsen & Lydiche. / 1884.''."
    );
    expect(caption.getElementsByTagName('i')[0].textContent)
      .toBe('Det befriede Jerusalem');
  });

  it('numbers multiple title pages while ignoring other pictures', () => {
    const pictures = titlepagePictures([
      { transcription: 'Første del' },
      { content_html: 'Dedikation' },
      { transcription: 'Anden del' },
    ], { title: 'Reiselyren', year: '1820' });
    expect(pictures[1].titlepageOrdinal).toBeUndefined();
    expect(parse(renderToStaticMarkup(<FigCaption picture={pictures[0]} />))
      .documentElement.textContent)
      .toBe("Første titelblad til Reiselyren (1820) lyder ,,Første del''.");
    expect(parse(renderToStaticMarkup(<FigCaption picture={pictures[2]} />))
      .documentElement.textContent)
      .toBe("Andet titelblad til Reiselyren (1820) lyder ,,Anden del''.");
  });

  it('checks every tracked work with a title-page picture', () => {
    const works = loadTrackedWorkFiles();
    const issues = works.flatMap(({ filename, content }) =>
      titlepageIssues(filename, parse(content)));
    expect(works.length).toBeGreaterThan(0);
    expect(issues).toEqual([]);
  });
});
