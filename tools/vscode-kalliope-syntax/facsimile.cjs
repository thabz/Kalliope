const path = require('path');

const parseAttributes = text => {
  const attrs = {};
  const attrRe = /([A-Za-z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let match;
  while ((match = attrRe.exec(text)) != null) {
    attrs[match[1]] = match[2] != null ? match[2] : match[3];
  }
  return attrs;
};

const parseXmlNodes = xml => {
  const root = {
    name: '#document',
    attrs: {},
    start: 0,
    openEnd: 0,
    end: xml.length,
    children: [],
    parent: null,
  };
  const stack = [root];
  const tagRe =
    /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<![^>]*>|<\/?([A-Za-z_:][\w:.-]*)([^<>]*?)\/?>/g;
  let match;

  while ((match = tagRe.exec(xml)) != null) {
    const raw = match[0];
    const name = match[1];
    if (name == null || raw.startsWith('<?') || raw.startsWith('<!--')) {
      continue;
    }

    if (raw.startsWith('</')) {
      for (let i = stack.length - 1; i > 0; i--) {
        const node = stack[i];
        if (node.name === name) {
          node.end = match.index + raw.length;
          stack.length = i;
          break;
        }
      }
      continue;
    }

    const parent = stack[stack.length - 1];
    const selfClosing = /\/\s*>$/.test(raw);
    const node = {
      name,
      attrs: parseAttributes(match[2] || ''),
      start: match.index,
      openEnd: match.index + raw.length,
      end: selfClosing ? match.index + raw.length : xml.length,
      children: [],
      parent,
    };
    parent.children.push(node);
    if (!selfClosing) {
      stack.push(node);
    }
  }

  return root;
};

const childByName = (node, name) => {
  return node.children.find(child => child.name === name) || null;
};

const childrenByName = (node, name) => {
  return node.children.filter(child => child.name === name);
};

const findDescendantsByName = (node, names, result = []) => {
  for (const child of node.children) {
    if (names.has(child.name)) {
      result.push(child);
    }
    findDescendantsByName(child, names, result);
  }
  return result;
};

const findSmallestNodeAtOffset = (nodes, offset) => {
  let best = null;
  for (const node of nodes) {
    if (node.start <= offset && offset <= node.end) {
      if (best == null || node.start >= best.start) {
        best = node;
      }
    }
  }
  return best;
};

const innerXml = (xml, node) => {
  return xml.slice(node.openEnd, node.end).replace(new RegExp(`</${node.name}>\\s*$`), '');
};

const stripTags = text => {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const parseKalliopeWorkPath = fileName => {
  const parts = path.normalize(fileName).split(path.sep);
  const fdirsIndex = parts.lastIndexOf('fdirs');
  if (fdirsIndex === -1 || parts.length < fdirsIndex + 3) {
    return null;
  }
  const poetId = parts[fdirsIndex + 1];
  const basename = parts[fdirsIndex + 2];
  if (!basename.toLowerCase().endsWith('.xml')) {
    return null;
  }
  return {
    poetId,
    workId: basename.replace(/\.xml$/i, ''),
  };
};

const parseNumericRange = value => {
  if (value == null || value.trim() === '') {
    return null;
  }
  const parts = value.split(/\s*-\s*/);
  const from = parseInt(parts[0], 10);
  const to = parts[1] != null ? parseInt(parts[1], 10) : from;
  if (!Number.isInteger(from) || !Number.isInteger(to)) {
    return null;
  }
  return [from, to];
};

const normalizeFacsimileId = facsimile => {
  return facsimile == null ? null : facsimile.replace(/\.pdf$/i, '');
};

const padPageFilename = page => {
  return `${page - 1}`.padStart(3, '0') + '.jpg';
};

const getTitle = (xml, textNode) => {
  const head = childByName(textNode, 'head');
  const title = head ? childByName(head, 'title') : null;
  const firstline = head ? childByName(head, 'firstline') : null;
  if (title != null) {
    return stripTags(innerXml(xml, title));
  }
  if (firstline != null) {
    return stripTags(innerXml(xml, firstline));
  }
  return textNode.attrs.id || textNode.name;
};

const getWorkSources = (workNode, xml) => {
  const workhead = childByName(workNode, 'workhead');
  const sources = {};
  if (workhead == null) {
    return sources;
  }

  for (const sourceNode of childrenByName(workhead, 'source')) {
    const id = sourceNode.attrs.id || 'default';
    const facsimile = normalizeFacsimileId(sourceNode.attrs.facsimile);
    const offset = sourceNode.attrs['facsimile-pages-offset'];
    const pageCount = sourceNode.attrs['facsimile-pages-num'];
    sources[id] = {
      id,
      sourceText: stripTags(innerXml(xml, sourceNode)),
      facsimile,
      facsimilePagesOffset:
        offset == null || offset === '' ? null : parseInt(offset, 10),
      facsimilePageCount:
        pageCount == null || pageCount === '' ? null : parseInt(pageCount, 10),
    };
  }
  return sources;
};

const resolveFacsimileForPosition = (xml, fileName, offset) => {
  const pathInfo = parseKalliopeWorkPath(fileName);
  if (pathInfo == null) {
    return {
      ok: false,
      reason: 'Denne fil ligger ikke under fdirs/<digter>/<værk>.xml.',
    };
  }

  const tree = parseXmlNodes(xml);
  const workNode = findDescendantsByName(tree, new Set(['kalliopework']))[0];
  if (workNode == null) {
    return {
      ok: false,
      reason: 'Filen ligner ikke en Kalliope-værkfil.',
    };
  }

  const textNode = findSmallestNodeAtOffset(
    findDescendantsByName(workNode, new Set(['text'])),
    offset
  );
  if (textNode == null) {
    return {
      ok: false,
      reason: 'Cursoren står ikke i en <text> med facsimile.',
    };
  }

  const head = childByName(textNode, 'head');
  const sourceNode = head ? childByName(head, 'source') : null;
  if (sourceNode == null) {
    return {
      ok: false,
      title: getTitle(xml, textNode),
      textId: textNode.attrs.id || null,
      reason: 'Den aktuelle tekst har ingen <head><source>.',
    };
  }

  const sources = getWorkSources(workNode, xml);
  const sourceId = sourceNode.attrs.in || 'default';
  const workSource = sources[sourceId];
  if (workSource == null) {
    return {
      ok: false,
      title: getTitle(xml, textNode),
      textId: textNode.attrs.id || null,
      reason: `Teksten refererer til en ukendt work source: ${sourceId}.`,
    };
  }

  const facsimile =
    normalizeFacsimileId(sourceNode.attrs.facsimile) || workSource.facsimile;
  if (facsimile == null) {
    return {
      ok: false,
      title: getTitle(xml, textNode),
      textId: textNode.attrs.id || null,
      reason: 'Kilden har ingen facsimile-attribut.',
    };
  }

  let facsimilePages = parseNumericRange(sourceNode.attrs['facsimile-pages']);
  if (facsimilePages == null && sourceNode.attrs['facsimile-pages'] != null) {
    return {
      ok: false,
      title: getTitle(xml, textNode),
      textId: textNode.attrs.id || null,
      reason: `facsimile-pages er ikke numerisk: ${sourceNode.attrs['facsimile-pages']}.`,
    };
  }

  if (facsimilePages == null) {
    const pages = parseNumericRange(sourceNode.attrs.pages);
    if (pages == null) {
      return {
        ok: false,
        title: getTitle(xml, textNode),
        textId: textNode.attrs.id || null,
        reason:
          'Tekstens pages kan ikke beregnes numerisk. Brug facsimile-pages for romertal eller specialpaginer.',
      };
    }
    if (!Number.isInteger(workSource.facsimilePagesOffset)) {
      return {
        ok: false,
        title: getTitle(xml, textNode),
        textId: textNode.attrs.id || null,
        reason: 'Work source mangler facsimile-pages-offset.',
      };
    }
    facsimilePages = [
      pages[0] + workSource.facsimilePagesOffset,
      pages[1] + workSource.facsimilePagesOffset,
    ];
  }

  if (facsimilePages[0] > facsimilePages[1]) {
    return {
      ok: false,
      title: getTitle(xml, textNode),
      textId: textNode.attrs.id || null,
      reason: 'Facsimile-sideintervallet har fra-side efter til-side.',
    };
  }

  if (
    Number.isInteger(workSource.facsimilePageCount) &&
    facsimilePages[1] > workSource.facsimilePageCount
  ) {
    return {
      ok: false,
      title: getTitle(xml, textNode),
      textId: textNode.attrs.id || null,
      reason: `Facsimile-side ${facsimilePages[1]} er større end kildens ${workSource.facsimilePageCount} sider.`,
    };
  }

  const pages = [];
  for (let page = facsimilePages[0]; page <= facsimilePages[1]; page++) {
    pages.push({
      page,
      filename: padPageFilename(page),
    });
  }

  return {
    ok: true,
    ...pathInfo,
    textId: textNode.attrs.id || null,
    title: getTitle(xml, textNode),
    sourceId,
    facsimile,
    facsimilePages,
    pages,
  };
};

module.exports = {
  normalizeFacsimileId,
  padPageFilename,
  parseKalliopeWorkPath,
  parseNumericRange,
  parseXmlNodes,
  resolveFacsimileForPosition,
};
