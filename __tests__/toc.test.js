import { renderToStaticMarkup } from 'react-dom/server';
import TOC from '../components/toc.js';

const text = { type: 'text', id: 'poem', title: [['Digt']], prefix: 'I.' };

describe('indholdsfortegnelsens digternavne', () => {
  it('viser navn og tankestreg uden for titlens link, også i underafsnit', () => {
    const markup = renderToStaticMarkup(<TOC lang="da" toc={[{
      type: 'section', title: [['Afsnit']], content: [{
        ...text, authorName: 'Jens Zetlitz',
      }],
    }]} />);
    expect(markup).toContain('</a><span class="author"><span class="author-separator"> — </span>Jens Zetlitz</span>');
    expect(markup).toMatch(/<a href="\/da\/text\/poem">[\s\S]*Digt[\s\S]*<\/a>/);
    expect(markup).toContain('I.');
  });

  it.each([undefined, ''])('udelader tomme eller manglende navne (%s)', authorName => {
    const markup = renderToStaticMarkup(
      <TOC lang="da" toc={[{ ...text, authorName }]} />
    );
    expect(markup).not.toContain('<span class="author">');
    expect(markup).not.toContain(' — ');
  });
});
