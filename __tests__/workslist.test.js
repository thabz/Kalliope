import { renderToStaticMarkup } from 'react-dom/server';
import WorksList from '../components/workslist.js';

const works = [
  { id: 'before', year: '1967', toctitle: { title: 'Før 1800' } },
  { id: 'first', year: '1961-1967', toctitle: { title: '1800-1870. Første halvbind' } },
  { id: 'second', year: '1961-1967', toctitle: { title: '1800-1870. Andet halvbind' } },
  { id: 'after', year: '1966', toctitle: { title: 'Efter 1870' } },
];

const renderedTitles = preserveOrder => {
  const markup = renderToStaticMarkup(
    <WorksList lang="da" poet={{ id: 'antologierdk' }} works={works} preserveOrder={preserveOrder} />
  );
  return [...markup.matchAll(/<td class="[^"]*workname\s+no-content[^"]*">([^<]+)/g)]
    .map(match => match[1]);
};

describe('værklister', () => {
  it('bevarer underbindenes rækkefølge, selv når udgivelsesårene afviger', () => {
    expect(renderedTitles(true)).toEqual(works.map(work => work.toctitle.title));
  });

  it('sorterer almindelige værklister efter udgivelsesår', () => {
    expect(renderedTitles(undefined)).toEqual([
      '1800-1870. Første halvbind',
      '1800-1870. Andet halvbind',
      'Efter 1870',
      'Før 1800',
    ]);
  });
});
