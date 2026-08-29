import {
  addDflIdentifier,
  appendWorkIds,
  retargetWork,
} from '../tools/merge-hidden-dfl-duplicates.js';

describe('fletning af skjulte DFL-dubletter', () => {
  it('tilføjer værker uden at duplikere eksisterende id-er', () => {
    const xml = '<person>\n  <works>1850,same</works>\n</person>\n';
    expect(appendWorkIds(xml, ['same', 'dfl-one'])).toContain(
      '<works>1850,same,dfl-one</works>'
    );
  });

  it('tilføjer DFL-id og afviser en identitetskonflikt', () => {
    const xml = '<person>\n  <identifiers>\n  </identifiers>\n</person>\n';
    expect(addDflIdentifier(xml, 'one')).toContain(
      '<danskforfatterleksikon-dk>one</danskforfatterleksikon-dk>'
    );
    expect(() => addDflIdentifier(
      '<person><identifiers><danskforfatterleksikon-dk>other</danskforfatterleksikon-dk></identifiers></person>',
      'one'
    )).toThrow('andet DFL-id');
  });

  it('omskriver værkets forfatter-id', () => {
    expect(retargetWork('<kalliopework author="dfl-one"/>', 'dfl-one', 'one'))
      .toBe('<kalliopework author="one"/>');
  });
});
