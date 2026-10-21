import { renderToStaticMarkup } from 'react-dom/server';
import { BiographyContent, PersonMeta } from '../pages/bio.js';

const poet = {
  type: 'poet',
  name: {
    firstname: 'André',
    lastname: 'Chénier',
    fullname: 'André Marie de Chénier',
  },
  period: {
    born: { date: '1762-10-30', place: 'Konstantinopel' },
    dead: { date: '1794-07-25', place: 'Paris' },
  },
};

describe('biography footnotes', () => {
  it('renders an errata note and its numbered footnote without crashing', () => {
    const html = renderToStaticMarkup(
      <BiographyContent
        biography={{
          content_html: [['Anskuelse af Gb.<footnote type="errata">Gb.] Gs.</footnote>', { html: true }]],
          content_lang: 'da',
          sources: [],
        }}
        lang="da"
      />
    );

    expect(html).toContain('Anskuelse af Gb.');
    expect(html).toContain('name="note-1"');
    expect(html).toContain('href="#note-1"');
    expect(html).toContain('Gb.] Gs.');
  });
});

describe('biography person metadata', () => {
  it('omits baptism when it is unknown', () => {
    const html = renderToStaticMarkup(<PersonMeta poet={poet} lang="da" />);

    expect(html).not.toContain('Døbt');
  });

  it('shows a documented baptism', () => {
    const html = renderToStaticMarkup(
      <PersonMeta
        poet={{
          ...poet,
          period: {
            ...poet.period,
            baptized: { date: '1762-11-01', place: 'Konstantinopel' },
          },
        }}
        lang="da"
      />
    );

    expect(html).toContain('Døbt');
    expect(html).toContain('1/11 1762');
    expect(html).toContain('Konstantinopel');
  });
});
