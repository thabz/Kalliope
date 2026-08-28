import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Heading } from '../components/page.js';

describe('page heading', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('server-renders the current date icon', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-12-03T12:00:00Z'));

    const html = renderToStaticMarkup(<Heading title="Kalliope" />);

    expect(html).toContain('/generated/images/about/kalliope-days/t/12-03-');
    expect(html).not.toContain('/generated/images/about/t/poet-');
  });
});
