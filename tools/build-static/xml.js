// TODO: Kan dette gøres mere effektivt?
const getChildNode = (element, childTag) => {
  if (element) {
    return element.querySelector(childTag);
  } else {
    return null;
  }
};

const getChildNodes = (element, query) => {
  // TODO: Hvis kun eet element findes, skal dette returneres i et array
  return element.querySelector(query);
};

const safeGetText = (element, childTag) => {
  const childNode = getChildNode(element, childTag);
  if (childNode) {
    return childNode.innerHTML;
  } else {
    return null;
  }
};

const safeGetAttr = (element, attrName) => {
  if (element) {
    return element.getAttribute(attrName);
  } else {
    return null;
  }
};

module.exports = {
  safeGetText,
  safeGetAttr,
  getChildNode,
  getChildNodes,
};
