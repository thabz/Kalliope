import { getChildByTagName, getChildren, safeGetAttr } from './xml.js';

export const parentText = node => {
  let parent = node.parentNode;
  while (parent != null) {
    if (parent.nodeName === 'text') return parent;
    parent = parent.parentNode;
  }
  return null;
};

// V1 represents one contiguous poem as a direct block in its enclosing text.
export const embeddedTextIssues = (text, filename = 'XML') => {
  const parent = parentText(text);
  const label = `${filename}: text ${safeGetAttr(text, 'id') ?? '(missing id)'}`;
  const contextAttributes = ['context-font-size', 'context-indent', 'context-quotes'];
  if (parent == null) {
    return contextAttributes.some(name => safeGetAttr(text, name) != null)
      ? [`${label}: context attributes require an embedded text.`] : [];
  }
  const issues = [];
  if (text.parentNode?.nodeName !== 'body' || text.parentNode.parentNode !== parent || parentText(parent) != null) {
    issues.push(`${label}: an embedded poem must be directly inside the enclosing text body, without further nesting.`);
  }
  const body = getChildByTagName(text, 'body');
  const blocks = getChildren(body) ?? [];
  if (blocks.length !== 1 || blocks[0].nodeName !== 'poetry') {
    issues.push(`${label}: an embedded poem requires exactly one poetry block.`);
  }
  if (safeGetAttr(text, 'id') == null || getChildByTagName(text, 'head') == null) {
    issues.push(`${label}: an embedded poem requires an id and head.`);
  }
  return issues;
};
