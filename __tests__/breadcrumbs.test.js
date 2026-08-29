import React from 'react';
import {
  kalliopeCrumbs,
  poetsCrumbs,
  textCrumbs,
  workCrumbs,
  worksCrumbs,
} from '../components/breadcrumbs.js';

describe('breadcrumb helpers', () => {
  const poet = {
    id: 'aarestrup',
    type: 'person',
    country: 'dk',
    name: {
      firstname: 'Emil',
      lastname: 'Aarestrup',
    },
    period: {
      born: { date: '1800-12-04' },
      dead: { date: '1856-07-21' },
    },
  };

  const work = {
    id: '1838',
    title: 'Digte',
    breadcrumbtitle: 'Digte',
  };

  it('builds the base breadcrumb trail', () => {
    expect(kalliopeCrumbs('en')).toEqual([
      {
        url: '/en/',
        title: 'Kalliope',
      },
    ]);
  });

  it('builds poet breadcrumbs for persons', () => {
    const crumbs = poetsCrumbs('en', poet);
    expect(crumbs[0].title).toBe('Kalliope');
    expect(crumbs[1]).toEqual({
      title: 'Persons',
      url: '/en/poets/dk/name',
    });
  });

  it('builds work breadcrumbs with a React title', () => {
    const crumbs = workCrumbs('en', poet, work);
    expect(crumbs[crumbs.length - 1].url).toBe('/en/work/aarestrup/1838');
    expect(React.isValidElement(crumbs[crumbs.length - 1].title)).toBe(true);
  });

  it('does not link the poet crumb to the current works page', () => {
    const crumbs = worksCrumbs('en', poet);
    expect(crumbs[crumbs.length - 2].url).toBeUndefined();
    expect(crumbs[crumbs.length - 1]).toEqual({
      title: 'Works',
      url: '/en/works/aarestrup',
    });
  });

  it('builds text breadcrumbs including section titles', () => {
    const crumbs = textCrumbs(
      'en',
      poet,
      work,
      [
        { id: 'section-1', title: 'Del 1' },
        { title: 'Del 2' },
      ],
      { linktitle: 'Digte' }
    );

    expect(crumbs[crumbs.length - 1]).toEqual({
      title: 'Digte',
      url: null,
    });
    expect(crumbs[4].url).toBe('/en/text/section-1');
    expect(React.isValidElement(crumbs[4].title)).toBe(true);
    expect(crumbs[5].url).toBe(null);
  });
});
