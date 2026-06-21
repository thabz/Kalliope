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
});
