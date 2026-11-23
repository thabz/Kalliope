// Inspect the prose around references, never the title supplied by their target.
const linksIn = node => Array.from(node.getElementsByTagName('*')).filter(
  child => ['xref', 'a'].includes(child.tagName),
);
const normalize = value => value.normalize('NFC').toLocaleLowerCase('da').replace(/\s+/gu, ' ').trim();
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');

export const collectTranslationNoteIssues = (filename, document, authorForText) => {
  const issues = [];
  for (const note of Array.from(document.getElementsByTagName('*')).filter(
    node => ['note', 'footnote'].includes(node.tagName),
  )) {
    if (note.hasAttribute('unknown-original-by')) continue;
    const links = linksIn(note);
    const poemLinks = links.filter(link => link.hasAttribute('poem'));
    if (poemLinks.length === 0) continue;
    let owner = note.parentNode;
    while (owner != null && owner.hasAttribute?.('id') !== true) owner = owner.parentNode;
    const location = `${filename}: ${owner?.getAttribute('id') ?? 'work'}: `;
    const prose = note.cloneNode(true);
    for (const link of linksIn(prose).filter(link => link.hasAttribute('poem'))) link.parentNode.removeChild(link);
    if (/\p{L}/u.test(prose.textContent) === false && poemLinks.every(link => link.textContent.trim().length === 0)) {
      issues.push(`${location}digtlink i note mangler forklarende tekst og digternavn.`);
      continue;
    }
    const translations = poemLinks.filter(link => link.getAttribute('type') === 'translation');
    if (translations.length === 0) continue;
    if (links.some(link => link.tagName !== 'xref' || link.hasAttribute('poem') === false)) {
      issues.push(`${location}kun <xref poem="..."/> må være klikbare i en forlægsnote; skriv digternavnet som almindelig tekst.`);
    }
    let explanation = normalize(prose.textContent);
    for (const link of translations) {
      const author = authorForText(link.getAttribute('poem').split(',')[0]);
      if (author == null) {
        issues.push(`${location}kan ikke finde forfatter til forlæg ${link.getAttribute('poem')}.`);
        continue;
      }
      let namedAuthor = false;
      for (const name of author.names) {
        if (name.trim().length === 0) continue;
        const pattern = new RegExp(`(?<![\\p{L}])${escapeRegex(normalize(name))}(?:s|['’])?(?![\\p{L}])`, 'gu');
        if (pattern.test(normalize(prose.textContent))) namedAuthor = true;
        explanation = explanation.replace(pattern, ' ');
      }
      if (author.anonymous !== true && namedAuthor === false) {
        issues.push(`${location}forlægsnote mangler digternavn (${author.names[0]}).`);
      }
    }
    if ((explanation.match(/\p{L}+/gu) ?? []).some(word => ['af', 'og', 's'].includes(word) === false) === false) {
      issues.push(`${location}forlægsnote mangler en forklaring af relationen.`);
    }
  }
  return issues;
};
