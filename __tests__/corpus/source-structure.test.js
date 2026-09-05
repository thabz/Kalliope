import { DOMParser } from '@xmldom/xmldom';
import {
  pageOnlySourceError,
  parsePageInterval,
} from '../../tools/build-static/source-validation.js';
import {
  collectSourcePolicyIssues,
  parseWorkXml,
} from '../../tools/work-validation.js';

describe('work source structure', () => {
  it('accepts only complete, nondecreasing page intervals', () => {
    expect(parsePageInterval('11')).toEqual({ from: 11, to: 11 });
    expect(parsePageInterval('11-13')).toEqual({ from: 11, to: 13 });
    expect(parsePageInterval('iii–v')).toEqual({ from: 3, to: 5 });
    expect(parsePageInterval('140-47')).toBeNull();
    expect(parsePageInterval('147-140')).toBeNull();
    expect(parsePageInterval('106-')).toBeNull();
  });

  it('reports a page-only source without a matching workhead source', () => {
    const document = new DOMParser().parseFromString(
      '<root><source pages="4-5"/></root>',
      'text/xml',
    );
    const textSource = document.documentElement.firstChild;

    expect(
      pageOnlySourceError({
        filename: 'fdirs/poet/work.xml',
        textId: 'poet1',
        textSource,
        workSources: {},
      }),
    ).toContain('no matching source in <workhead>');
  });

  it('reports disallowed source structures and source-like notes', () => {
    const document = parseWorkXml(`
      <kalliopework>
        <workhead><source>Kilde</source></workhead>
        <workbody>
          <text id="poet1">
            <head>
              <source><a href="https://example.org">Udgave</a></source>
              <notes><note>Teksten\n  følger denne udgave.</note></notes>
            </head>
          </text>
        </workbody>
      </kalliopework>
    `);

    const issues = collectSourcePolicyIssues('fdirs/poet/andre.xml', document);

    expect(issues.andreWorkheadSources).toHaveLength(1);
    expect(issues.externalSourceLinks).toHaveLength(1);
    expect(issues.textFollowsNotes).toHaveLength(1);
  });

  it('allows internal source links and ignores commented-out markup', () => {
    const document = parseWorkXml(`
      <kalliopework>
        <workhead/>
        <workbody>
          <text id="poet1">
            <head>
              <source href="https://example.org"><a poet="poet">Digter</a>: Udgave</source>
              <notes><note>Kildekritisk bemærkning.</note></notes>
            </head>
          </text>
          <!-- <note>Teksten følger en anden udgave.</note> -->
        </workbody>
      </kalliopework>
    `);

    expect(
      collectSourcePolicyIssues('fdirs/poet/andre.xml', document),
    ).toEqual({
      andreWorkheadSources: [],
      externalSourceLinks: [],
      textFollowsNotes: [],
    });
  });
});
