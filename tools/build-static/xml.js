import fs from 'fs';
import { DOMParser, XMLSerializer } from 'xmldom';
import { loadText } from '../libs/helpers.js';

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

const getChildNode = (element, childTag) => {
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

const findChildNodes = (element, query) => {
  if (element) {
    // TODO: Hvis kun eet element findes, skal dette returneres i et array
    return element.getElementsByTagName(query);
  } else {
    return null;
  }
};

const safeGetText = (element, childTag) => {
  const childNode = getChildNode(element, childTag);
  if (childNode) {
    return childNode.textContent;
  } else {
    return null;
  }
};

const safeGetOuterXML = (element, childTag) => {
  const childNode = getChildNode(element, childTag);
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
  getChildNode,
  findChildNodes,
  tagName,
  safeGetOuterXML,
};
