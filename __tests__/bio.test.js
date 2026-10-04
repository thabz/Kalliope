import { renderToStaticMarkup } from 'react-dom/server';
import { PersonMeta } from '../pages/bio.js';

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
