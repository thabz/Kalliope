import fs from 'fs';
import { execFileSync } from 'child_process';
import { classifyPoetXml, discoverPoetFiles } from '../../tools/libs/poet-files.js';
import { sortWorks } from '../../common/worksort.js';

describe('XML files in poet directories', () => {
  it('assigns every tracked XML file a supported build function and registers every work', () => {
    const filenames = execFileSync('git', ['ls-files', '-z', '--', 'fdirs'], { encoding: 'utf8' })
      .split('\0').filter(filename => filename.endsWith('.xml'));
    const poetIds = [...new Set(filenames.map(filename => filename.split('/')[1]))];
    const registry = discoverPoetFiles(poetIds);
    const issues = [];
    filenames.forEach(filename => {
      try {
        if (filename.split('/').length !== 3) {
          throw new Error(`${filename}: XML skal ligge direkte i en digtermappe.`);
        }
        const classification = classifyPoetXml(filename, fs.readFileSync(filename, 'utf8'));
        if (classification.kind === 'work' &&
          registry.workids.get(filename.split('/')[1]).includes(classification.id) === false) {
          issues.push(`${filename}: værket bliver ikke registreret af buildet.`);
        }
      } catch (error) {
        issues.push(error.message);
      }
    });
    expect(issues).toEqual([]);
  });

  it('preserves the canonical Bible order in lists and navigation', () => {
    const expected = '1mose,2mose,3mose,4mose,5mose,josua,dommer,rut,1samuel,2samuel,1konge,2konge,1kroen,2kroen,ezra,nehemias,ester,job,salme,ordsprog,praed,hoej,esajas,jeremias,klage,ezekiel,daniel,hoseas,joel,amos,obadias,jonas,mikas,nahum,habakkuk,zefanias,haggaj,zakarias,malakias,matt,markus,lukas,johannes,apostlene,rom,1korint,2korint,galaterne,efeserne,filipperne,kolossen,1tessa,2tessa,1timoteus,2timoteus,titus,filemon,hebrae,jakob,1peter,2peter,1johannes,2johannes,3johannes,judas,aabenbaringen'.split(',');
    const { workids, cache } = discoverPoetFiles(['bibel']);
    expect(workids.get('bibel')).toEqual(expected);
    const works = expected.toReversed().map(id => ({
      id, sort_order: cache.files[`fdirs/bibel/${id}.xml`].classification.sortOrder,
    }));
    expect(sortWorks({ id: 'bibel' }, works).map(work => work.id)).toEqual(expected);
  });
});
