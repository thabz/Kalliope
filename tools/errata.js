import { parsePageInterval } from './build-static/source-validation.js';

const children = (node, name) => Array.from(node?.childNodes ?? [])
  .filter(child => child.nodeType === 1 && child.nodeName === name);

const child = (node, name) => children(node, name)[0] ?? null;

const printedPagesValid = pages => {
  if (pages == null || pages.trim() === '') return false;
  const trimmed = pages.trim();
  if (trimmed === '[upagineret]') return true;
  if (trimmed.startsWith('[') !== trimmed.endsWith(']')) return false;
  const unwrapped = trimmed.startsWith('[') ? trimmed.slice(1, -1) : trimmed;
  return parsePageInterval(unwrapped) != null;
};

const facsimileInterval = value => {
  if (value == null || !/^\d+(?:-\d+)?$/.test(value)) return null;
  const [from, to = from] = value.split('-').map(Number);
  return from > 0 && to >= from ? [from, to] : null;
};

const validateErrata = (work, filename, { requireDeclaration = false } = {}) => {
  const issues = [];
  const head = child(work, 'workhead');
  const declarations = children(head, 'errata');
  const allDeclarations = Array.from(work.getElementsByTagName('errata'));
  if (allDeclarations.length !== declarations.length) {
    issues.push(`${filename}: <errata> skal stå direkte i <workhead>`);
  }
  const applied = declarations.filter(node => node.getAttribute('status') === 'applied');
  const recorded = declarations.filter(node => ['applied', 'reviewed'].includes(node.getAttribute('status')));
  const none = declarations.filter(node => node.getAttribute('status') === 'none');
  if (requireDeclaration && declarations.length === 0) {
    issues.push(`${filename}: et nyt komplet facsimileværk mangler <errata> i <workhead>`);
  }
  if (none.length > 0 && declarations.length !== 1) {
    issues.push(`${filename}: <errata status="none"/> må stå alene`);
  }
  const sources = children(head, 'source');
  recorded.forEach((node, index) => {
    const label = `${filename}: errata ${index + 1}`;
    const pages = node.getAttribute('pages');
    const interval = facsimileInterval(node.getAttribute('facsimile-pages'));
    const sourceId = node.getAttribute('in') ?? 'default';
    const source = sources.find(item => (item.getAttribute('id') ?? 'default') === sourceId);
    if (!printedPagesValid(pages)) issues.push(`${label} har ugyldigt pages-interval`);
    if (interval == null) issues.push(`${label} har ugyldigt facsimile-pages-interval`);
    if (source == null || (source.getAttribute('facsimile') ?? '').trim() === '') {
      issues.push(`${label} mangler en tilknyttet facsimilekilde`);
    } else if (interval != null) {
      const count = Number(source.getAttribute('facsimile-pages-num'));
      if (!Number.isInteger(count) || interval[1] > count) {
        issues.push(`${label} ligger uden for facsimilekildens sider`);
      }
    }
  });
  none.forEach(node => {
    if (node.hasAttribute('pages') || node.hasAttribute('facsimile-pages') || node.hasAttribute('in')) {
      issues.push(`${filename}: <errata status="none"/> må ikke have side- eller kildeattributter`);
    }
  });

  const errataFootnotes = Array.from(work.getElementsByTagName('footnote'))
    .filter(node => node.getAttribute('type') === 'errata');
  if (errataFootnotes.length > 0) {
    issues.push(`${filename}: rettelsesfodnoter er ikke tilladt i værker; brug <!-- Rettelsesark: rettet] trykt -->`);
  }
  const comments = [];
  const collectComments = node => {
    for (const item of Array.from(node.childNodes ?? [])) {
      if (item.nodeType === 8 && /^\s*Rettelsesark\b/iu.test(item.data)) {
        comments.push(item.data.trim());
      }
      collectComments(item);
    }
  };
  collectComments(work);
  let validComments = 0;
  comments.forEach((text, index) => {
    const match = /^Rettelsesark: ([^\]\r\n]+)\] ([^\]\r\n]+)$/.exec(text);
    if (match == null || match[1].trim() === '' || match[2].trim() === '' || match[1].trim() === match[2].trim()) {
      issues.push(`${filename}: rettelseskommentar ${index + 1} skal have formen Rettelsesark: rettet] trykt med forskellige læsemåder`);
    } else {
      validComments += 1;
    }
  });
  if (applied.length > 0 && validComments === 0) {
    issues.push(`${filename}: <errata status="applied"/> kræver mindst én gyldig rettelseskommentar`);
  }
  if (applied.length === 0 && comments.length > 0) {
    issues.push(`${filename}: rettelseskommentar kræver <errata status="applied"/>`);
  }
  return issues;
};

export { children, child, facsimileInterval, validateErrata };
