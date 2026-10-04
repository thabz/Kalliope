import { renderToStaticMarkup } from 'react-dom/server';
import LangContext from '../common/LangContext.js';
import { poetMenu } from '../components/menu.js';

const VisiblePoetMenu = ({ poet }) => {
  const items = poetMenu(poet).filter((item) => item.hide !== true);
  return items.map((item) => <span key={item.id}>{item.id}</span>);
};

const renderMenu = (poet) =>
  renderToStaticMarkup(
    <LangContext.Provider value="da">
      <VisiblePoetMenu poet={poet} />
    </LangContext.Provider>
  );

describe('poet menu', () => {
  const poet = {
    id: 'antologierfr',
    has_works: true,
    has_artwork: false,
    has_mentions: false,
    has_biography: false,
  };

  it('hides poem indexes without indexed poems', () => {
    const html = renderMenu({ ...poet, has_indexed_poems: false });

    expect(html).not.toContain('titles');
    expect(html).not.toContain('first');
  });

  it('shows poem indexes when indexed poems exist', () => {
    const html = renderMenu({ ...poet, has_indexed_poems: true });

    expect(html).toContain('titles');
    expect(html).toContain('first');
  });
});
