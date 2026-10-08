import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TextContent from '../components/textcontent.js';
import { htmlToXml } from '../tools/libs/helpers.js';

const collected = {
  texts: new Map(),
  keywords: new Map(),
  dict: new Map(),
};

describe('text content XML entities', () => {
  it.each(['poetry', 'prose'])('renders an escaped ampersand in %s without inline tags', type => {
    const html = renderToStaticMarkup(
      <TextContent
        type={type}
        contentHtml={htmlToXml('Mourir , &amp;c.', collected, type === 'poetry')}
      />
    );

    expect(html).toContain('>Mourir , &amp;c.</div>');
    expect(html).not.toContain('&amp;amp;');
  });

  it('keeps escaped markup literal and decodes entities only once', () => {
    const html = renderToStaticMarkup(
      <TextContent
        type="poetry"
        contentHtml={[
          ['&lt;i&gt;Texte&lt;/i&gt; &amp;amp;c. &#198; &#xC6;'],
        ]}
      />
    );

    expect(html).toContain('&lt;i&gt;Texte&lt;/i&gt; &amp;amp;c. Æ Æ');
    expect(html).not.toContain('<i>Texte</i>');
  });
});
