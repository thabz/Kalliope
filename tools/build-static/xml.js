const safeGetText = (element, child) => {
  if (element) {
    const childElement = element.get(child);
    if (childElement) {
      return childElement.text();
    }
  }
  return null;
};

const safeGetAttr = (element, attrName) => {
  if (element) {
    const attrElement = element.attr(attrName);
    if (attrElement) {
      return attrElement.value();
    }
  }
  return null;
};

module.exports = {
  safeGetText,
  safeGetAttr,
};
