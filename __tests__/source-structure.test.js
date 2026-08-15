import fs from 'fs';
import { execFileSync } from 'child_process';
import { DOMParser } from '@xmldom/xmldom';
import {
  pageIntervalError,
  pageOnlySourceError,
  parsePageInterval,
} from '../tools/build-static/source-validation.js';

const workFiles = () =>
  execFileSync('git', ['ls-files', 'fdirs/*/*.xml'], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
    .filter(filename => /<kalliopework\b/.test(fs.readFileSync(filename, 'utf8')));

const directChildren = (element, name) =>
  Array.from(element.childNodes).filter(
    child => child.nodeType === 1 && child.nodeName === name,
  );

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

  it('requires a workhead source for every page-only text source', () => {
    const violations = [];

    workFiles().forEach(filename => {
      const document = new DOMParser().parseFromString(
        fs.readFileSync(filename, 'utf8'),
        'text/xml',
      );
      const work = document.documentElement;
      const workhead = directChildren(work, 'workhead')[0];

      Array.from(work.getElementsByTagName('text')).forEach(text => {
        const head = directChildren(text, 'head')[0];
        if (head == null) {
          return;
        }
        directChildren(head, 'source').forEach(textSource => {
          const error = pageOnlySourceError({
            filename,
            textId: text.getAttribute('id') ?? '(ukendt tekst)',
            textSource,
            workhead,
          });
          if (error != null) {
            violations.push(error);
          }
        });
      });
    });

    expect(violations).toEqual([]);
  });

  it('requires legal pages values on every tracked text source', () => {
    const violations = [];

    workFiles().forEach(filename => {
      const document = new DOMParser().parseFromString(
        fs.readFileSync(filename, 'utf8'),
        'text/xml',
      );
      const work = document.documentElement;

      Array.from(work.getElementsByTagName('source')).forEach(textSource => {
        if (
          textSource.getAttribute('pages') == null ||
          textSource.parentNode?.nodeName !== 'head' ||
          textSource.parentNode?.parentNode?.nodeName === 'workhead'
        ) {
          return;
        }
        const text = textSource.parentNode.parentNode;
        const error = pageIntervalError({
          filename,
          textId: text.getAttribute('id') ?? '(ukendt tekst)',
          textSource,
        });
        if (error != null) {
          violations.push(error);
        }
      });
    });

    expect(violations).toEqual([]);
  });
});
