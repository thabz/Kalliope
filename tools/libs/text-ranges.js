// Keep original source offsets while handling nested text entries. Comments and
// CDATA may contain examples of XML tags and must not participate in the stack.
const preserveLines = value => value.replace(/[^\r\n]/g, ' ');

const textRanges = data => {
  const ranges = [];
  const stack = [];
  for (const token of data.matchAll(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<text\b[^>]*>|<\/text\s*>/g)) {
    const tag = token[0];
    if (tag.startsWith('<!')) continue;
    if (tag.startsWith('</')) {
      const range = stack.pop();
      if (range != null) range.end = token.index + tag.length;
    } else {
      const range = { start: token.index, end: token.index + tag.length, openingTag: tag, children: [], nested: stack.length > 0 };
      if (stack.length > 0) stack.at(-1).children.push(range);
      ranges.push(range);
      if (tag.endsWith('/>') === false) stack.push(range);
    }
  }
  return ranges;
};

const replaceChildren = (data, range, own, child) => {
  let cursor = range.start;
  let result = '';
  for (const nested of range.children) {
    result += own(data.slice(cursor, nested.start)) + child(nested);
    cursor = nested.end;
  }
  return result + own(data.slice(cursor, range.end));
};

// Regex-compatible matches of each entry's own content, with child entries
// masked so verse, notes and diagnostics are attributed exactly once.
export const textMatches = data => textRanges(data).map(range => {
  const match = [replaceChildren(data, range, value => value,
    child => preserveLines(data.slice(child.start, child.end)))];
  match.index = range.start;
  return match;
});

// Filtering a parent must not discard an independently eligible child. Masking
// complete entries (rather than matching up to the first closing text tag)
// also keeps the remaining XML balanced and its line numbers unchanged.
export const filterTextElements = (data, include) => {
  const ranges = textRanges(data);
  const render = range => replaceChildren(data, range,
    include(range.openingTag) === true ? value => value : preserveLines, render);
  const root = { start: 0, end: data.length, children: ranges.filter(range => range.nested === false) };
  return replaceChildren(data, root, value => value, render);
};
