import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TextInline } from '../components/textcontent.js';

describe('text content overlines', () => {
  it('preserves abbreviated letters, long s and adjacent text', () => {
    const html = renderToStaticMarkup(
      <TextInline contentHtml={[[ 'ha̅ ſøn thm̅' ]]} />
    );

    expect(html).toContain(
      'ha̅ ſøn thm̅'
    );
  });

  it('keeps nested emphasis and a source page marker within an overline', () => {
    const html = renderToStaticMarkup(
      <TextInline contentHtml={[[ '<i>m̅</i><pb facs="006.jpg"/>n̅' ]]} />
    );

    expect(html).toContain(
      '<i>m̅</i>n̅'
    );
    expect(html).not.toContain('<pb');
  });
});
