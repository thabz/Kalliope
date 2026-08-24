import fs from 'fs';
import os from 'os';
import path from 'path';
import { selectRhymeTrainingPoems, summarizeRhymeTrainingPoems } from '../tools/rhyme-corpus.js';
import { writeRhymeModel } from '../tools/train-rhyme-model.js';

const poem = (id, stanzas, attributes = '') =>
  `<text id="${id}"${attributes}><head/><body><poetry>${stanzas}</poetry></body></text>`;

describe('rhyme corpus', () => {
  test('selects poems in the year range with five equally long stanzas', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kalliope-rhyme-corpus-'));
    const directory = path.join(root, 'fdirs', 'testpoet');
    fs.mkdirSync(directory, { recursive: true });
    const validStanza = 'En rose\nEn rand\nEn rose\nEt land';
    const shortStanza = 'En rose\nEn rand\nEt land';
    const mixedStanza = `${validStanza}\nEn måne`;
    fs.writeFileSync(path.join(directory, 'info.xml'),
      '<person id="testpoet" country="gb" lang="en" type="poet"/>');
    const xml = `<kalliopework id="1850" author="testpoet"><workhead><year>1850</year></workhead><workbody>
${poem('foreign', Array.from({ length: 5 }, () => validStanza).join('\n\n'))}
${poem('valid', Array.from({ length: 5 }, () => validStanza).join('\n\n'), ' lang="da"')}
${poem('short', Array.from({ length: 5 }, () => shortStanza).join('\n\n'))}
${poem('mixed', [...Array.from({ length: 4 }, () => validStanza), mixedStanza].join('\n\n'), ' lang="da"')}
</workbody></kalliopework>`;
    fs.writeFileSync(path.join(directory, '1850.xml'), xml);

    const selected = selectRhymeTrainingPoems(root);

    expect(selected.map(candidate => candidate.id)).toEqual(['valid']);
    expect(summarizeRhymeTrainingPoems(selected)).toEqual({
      poems: 1, works: 1, poets: 1, stanzas: 5, lines: 20,
    });
  });

  test('writes deterministic compressed model data', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kalliope-rhyme-model-'));
    const first = path.join(root, 'first.json.gz');
    const second = path.join(root, 'second.json.gz');
    const model = { format: 1, operations: { 'a>e': 0.5 }, pairs: {}, threshold: 0.76 };

    writeRhymeModel(model, first);
    writeRhymeModel(model, second);

    expect(fs.readFileSync(first)).toEqual(fs.readFileSync(second));
  });
});
