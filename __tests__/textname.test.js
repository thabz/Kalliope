import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TextName from '../components/textname.js';
import {
  FootnoteContainer,
  FootnoteList,
} from '../components/footnotes.js';
import {
  textLinkTitleString,
  textTitleString,
} from '../components/textname.js';

describe('text name helpers', () => {
  it('returns the title string directly', () => {
    expect(textTitleString({ title: 'Ode' })).toBe('Ode');
  });

  it('returns the link title directly', () => {
    expect(textLinkTitleString({ linktitle: 'Ode til nogen' })).toBe(
      'Ode til nogen'
    );
  });

  it('renders and lists a footnote in the displayed title', () => {
    const html = renderToStaticMarkup(
      <FootnoteContainer>
        <TextName
          text={{
            title: 'Gravsang',
            title_html: [['Gravsang<footnote>Kildens note.</footnote>']],
          }}
          renderMarkup
        />
        <FootnoteList />
      </FootnoteContainer>
    );

    expect(html).toContain('Gravsang');
    expect(html).toContain('name="note-1"');
    expect(html).toContain('Kildens note.');
  });
});
