import {
  checksForWorkXml,
  loadWorkCorpus,
  trackedWorkFiles,
} from './support/work-corpus.js';

describe('work corpus support', () => {
  it('discovers tracked work files from git output', () => {
    const execute = jest.fn(() => 'fdirs/poet/one.xml\nfdirs/poet/two.xml\n');

    expect(trackedWorkFiles({ execute })).toEqual([
      'fdirs/poet/one.xml',
      'fdirs/poet/two.xml',
    ]);
    expect(execute).toHaveBeenCalledWith(
      'git',
      expect.arrayContaining(['grep', '-l', 'fdirs/*/*.xml']),
      { encoding: 'utf8' },
    );
  });

  it('loads each discovered work exactly once', () => {
    const readFile = jest.fn(filename => `<kalliopework file="${filename}"/>`);

    expect(loadWorkCorpus({
      filenames: ['first.xml', 'second.xml'],
      readFile,
    })).toEqual([
      { filename: 'first.xml', xml: '<kalliopework file="first.xml"/>' },
      { filename: 'second.xml', xml: '<kalliopework file="second.xml"/>' },
    ]);
    expect(readFile).toHaveBeenCalledTimes(2);
  });

  it('only requests DOM parsing for relevant work checks', () => {
    expect(checksForWorkXml('<kalliopework/>')).toEqual({
      pageBreaks: false,
      sources: false,
    });
    expect(checksForWorkXml('<source\n pages="1-2"/>')).toEqual({
      pageBreaks: false,
      sources: true,
    });
    expect(checksForWorkXml('<pagebreaks/>')).toEqual({
      pageBreaks: true,
      sources: false,
    });
  });
});
