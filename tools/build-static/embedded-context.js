import { parentText } from './embedded-text.js';
import { getChildByTagName, getChildren, safeGetText } from './xml.js';

const ordinalWords = [
  ['første'], ['anden', 'andet'], ['tredie', 'tredje'], ['fjerde'], ['femte'],
  ['sjette', 'siette'], ['syvende'], ['ottende'], ['niende'], ['tiende'],
  ['ellevte'], ['tolvte'], ['trettende'], ['fjortende'], ['femtende'],
  ['sekstende', 'sextende'], ['syttende'], ['attende'], ['nittende'], ['tyvende'],
];

const division = title => {
  const match = title.toLowerCase().match(/^(.+?)\.?\s+(akt|scene|optog|optrin)\.?$/u);
  if (match == null) return null;
  const word = match[1];
  const number = /^\d+$/.test(word) === true
    ? Number(word) : ordinalWords.findIndex(words => words.includes(word)) + 1;
  return number > 0 ? { number, unit: match[2] } : null;
};

const titleOf = node => {
  const head = getChildByTagName(node, 'head');
  for (const name of ['title', 'toctitle', 'linktitle', 'firstline']) {
    const title = safeGetText(getChildByTagName(head, name));
    if (title != null && title.trim().length > 0) return title.trim().replace(/\s+/g, ' ');
  }
  return null;
};

// Legacy drama scenes are often headings inside a prose block rather than
// sections. Only accept a complete numbered heading before this poem; never
// inspect dialogue, notes, or another embedded text for a scene reference.
const precedingScene = (body, text) => {
  let scene = null;
  const visit = node => {
    if (['note', 'footnote', 'text'].includes(node.nodeName) === true) return;
    if (node.nodeName === 'center') {
      const candidate = division(node.textContent.trim().replace(/\s+/g, ' '));
      if (candidate != null && ['scene', 'optrin'].includes(candidate.unit) === true) {
        scene = candidate;
      }
    }
    for (const child of getChildren(node) ?? []) visit(child);
  };
  for (const block of getChildren(body) ?? []) {
    if (block === text) break;
    visit(block);
  }
  return scene;
};

export const embeddedContext = text => {
  const parent = parentText(text);
  if (parent == null) return null;
  const ancestors = [];
  let node = parent;
  while (node != null && node.nodeName !== 'kalliopework') {
    ancestors.unshift(node);
    node = node.parentNode;
  }
  if (node == null) return null;
  let title = safeGetText(getChildByTagName(getChildByTagName(node, 'workhead'), 'title'))?.trim();
  let parts = [];
  for (const ancestor of ancestors) {
    if (['text', 'section'].includes(ancestor.nodeName) === false) continue;
    const locationTitle = titleOf(ancestor);
    if (locationTitle == null) continue;
    const numbered = division(locationTitle);
    if (numbered != null) {
      parts.push(numbered);
    } else if (ancestor.nodeName === 'section' &&
      getChildByTagName(getChildByTagName(ancestor, 'head'), 'title') != null) {
      // A named subwork (e.g. Freyas Altar) is more precise than its book title.
      title = locationTitle;
      parts = [];
    } else if (ancestor === parent) {
      parts.push({ title: locationTitle });
    }
  }
  const scene = precedingScene(getChildByTagName(parent, 'body'), text);
  const last = parts.at(-1);
  if (scene != null && (scene.number !== last?.number || scene.unit !== last?.unit)) parts.push(scene);
  return { title: title ?? titleOf(parent), parts };
};
