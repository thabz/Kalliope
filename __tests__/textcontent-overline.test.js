import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TextInline } from '../components/textcontent.js';

describe('text content overlines', () => {
  it('preserves abbreviated letters, long s and adjacent text', () => {
    const html = renderToStaticMarkup(
      <TextInline contentHtml={[[ 'h<o>a</o> ſøn th<o>m</o>' ]]} />
    );

    expect(html).toContain(
      'h<span style="text-decoration:overline">a</span> ſøn th<span style="text-decoration:overline">m</span>'
    );
  });

  it('keeps nested emphasis and a source page marker within an overline', () => {
    const html = renderToStaticMarkup(
      <TextInline contentHtml={[[ '<o><i>m</i><pb facs="006.jpg"/>n</o>' ]]} />
    );

    expect(html).toContain(
      '<span style="text-decoration:overline"><i>m</i>n</span>'
    );
    expect(html).not.toContain('<pb');
  });
});
