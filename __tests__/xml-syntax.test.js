import { execFileSync } from 'child_process';

const sourceXmlFilenames = () =>
  execFileSync(
    'git',
    [
      'ls-files',
      '-z',
      '--',
      'fdirs',
      'content',
    ],
    { encoding: 'utf8' },
  )
    .split('\0')
    .filter(filename => filename.endsWith('.xml'));

const validateXmlSyntax = filenames => {
  try {
    execFileSync('xmllint', ['--noout', ...filenames], {
      encoding: 'utf8',
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    return null;
  } catch (error) {
    return error.stderr || error.message;
  }
};

describe('XML syntax', () => {
  it('parses every tracked Kalliope source XML file', () => {
    const filenames = sourceXmlFilenames();

    expect(filenames.length).toBeGreaterThan(0);
    expect(validateXmlSyntax(filenames)).toBeNull();
  });
});
