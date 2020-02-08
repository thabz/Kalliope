const { DOMParser, XMLSerializer } = require('xmldom');
const { loadText } = require('../libs/helpers.js');

const parseXMLFragment = xmlString => {
  return new DOMParser().parseFromString(xmlString, 'text/xml');
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
    const items = element.getElementsByTagName(childTag);
    if (items.length > 0) {
      return items[0];
    } else {
      return null;
    }
  } else {
    return null;
  }
};

const safeGetText = (element, childTag) => {
  const childNode = getElementByTagName(element, childTag);
  if (childNode) {
    return childNode.textContent;
  } else {
    return null;
  }
};

const safeGetOuterXML = (element, childTag) => {
  const childNode = getElementByTagName(element, childTag);
  if (childNode) {
    return new XMLSerializer().serializeToString(childNode);
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

const tagName = element => {
  return element.tagName;
};

module.exports = {
  loadXMLDoc,
  safeGetText,
  safeGetAttr,
  getElementByTagName,
  getElementsByTagName,
  getElementsByTagNames,
  tagName,
  safeGetOuterXML,
};
