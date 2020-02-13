const { DOMParser, XMLSerializer } = require('xmldom');
const { loadText } = require('../libs/helpers.js');
const { entityMap } = require('./entities.js');

const parseXMLFragment = xmlString => {
  const s = xmlString.replace(/&([A-Za-z]+);/g, (m, e) => {
    const replacement = entityMap[e];
    if (replacement == null) {
      throw `Unknown entity &${e};`;
    }
    return replacement;
  });
  return new DOMParser().parseFromString(s, 'text/xml');
};

const loadXMLDoc = filename => {
  const data = loadText(filename);
  if (data == null) {
    return null;
  }
  try {
    return parseXMLFragment(data);
  } catch (err) {
    console.log(`Problem with ${filename}`);
    throw err;
  }
};

const getElementsByTagName = (element, tagName) => {
  const result = [];
  if (element) {
    const list = element.getElementsByTagName(tagName);
    for (let i = 0; i < list.length; i++) {
      result.push(list[i]);
    }
    return result;
  } else {
    return null;
  }
};

// Ex. getElementsByTagNames(work, ['poem','section'])
const getElementsByTagNames = (element, tagNames) => {
  if (element) {
    const arrays = tagNames.map(tagName => {
      return getElementsByTagName(element, tagName);
    });
    // Flatten
    const merged = [].concat.apply([], arrays);
    return merged;
  } else {
    return null;
  }
};

const getElementByTagName = (element, childTag) => {
  if (element) {
    const items = getElementsByTagName(element, childTag);
    if (items.length > 0) {
      return items[0];
    } else {
      return null;
    }
  } else {
    return null;
  }
};

const getChildren = element => {
  if (element) {
    let result = [];
    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes[i];
      if (child.nodeType === 1 /* ELEMENT_NODE */) {
        result.push(child);
      }
    }
    return result;
  } else {
    return null;
  }
};

const getChildrenByTagName = (element, childTag) => {
  if (element) {
    return getChildren(element).filter(c => tagName(c) === childTag);
  } else {
    return null;
  }
};

const getChildByTagName = (element, childTag) => {
  const children = getChildrenByTagName(element, childTag);
  if (children != null && children.length > 0) {
    return children[0];
  } else {
    return null;
  }
};

const getChildrenByTagNames = (element, childTags) => {
  if (element) {
    return getChildren(element).filter(c => childTags.indexOf(tagName(c)) > -1);
  } else {
    return null;
  }
};

const safeGetText = (element, optionalTagName) => {
  if (element) {
    let e = element;
    if (optionalTagName) {
      e = getElementByTagName(element, optionalTagName);
    }
    if (e) {
      return e.textContent;
    }
  }
  return null;
};

const safeGetOuterXML = element => {
  if (element) {
    return new XMLSerializer().serializeToString(element);
  } else {
    return null;
  }
};

const safeGetInnerXML = element => {
  const outer = safeGetOuterXML(element);
  if (outer == null) {
    return null;
  }
  const t = tagName(element);
  return outer
    .replace(new RegExp('<' + t + '[^>]*>'), '')
    .replace('<' + t + '>', '')
    .replace('</' + t + '>', '')
    .replace('<' + t + '/>', '');
};

const safeGetAttr = (element, attrName) => {
  if (element && element.hasAttribute(attrName)) {
    return element.getAttribute(attrName);
  } else {
    return null;
  }
};

const tagName = element => {
  return element.tagName;
};

const safeTrim = str => {
  return str == null ? null : str.trim();
};

module.exports = {
  loadXMLDoc,
  safeGetText,
  safeGetAttr,
  safeTrim,
  getElementByTagName,
  getElementsByTagName,
  getElementsByTagNames,
  getChildren,
  getChildByTagName,
  getChildrenByTagName,
  getChildrenByTagNames,
  tagName,
  safeGetOuterXML,
  safeGetInnerXML,
};
