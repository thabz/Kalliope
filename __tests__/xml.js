import {
  safeGetText,
  safeGetAttr,
  getElementByTagName,
  getElementsByTagName,
  getElementsByTagNames,
  getChildrenByTagName,
  getChildrenByTagNames,
  getChildren,
  tagName,
  safeGetOuterXML,
  safeGetInnerXML,
  loadXMLDoc,
} from '../tools/build-static/xml.js';

describe('XML parser', () => {
  const doc = loadXMLDoc('__tests__/xml.xml');
  it('read a file', () => {
    expect(doc).not.toBeNull();
  });

  it('get direct child', () => {
    const work = getElementByTagName(doc, 'subtitle');
    expect(work).not.toBeNull();
  });

  it('understands tag-names', () => {
    const name = tagName(getElementByTagName(doc, 'title'));
    expect(name).toEqual('title');
  });

  it('get attribute value', () => {
    const work = getElementByTagName(doc, 'work');
    const author = safeGetAttr(work, 'author');
    expect(author).toEqual('baggesen');
  });

  it('extract text', () => {
    const title = safeGetText(doc, 'title');
    expect(title).toEqual('Ode');
  });

  it('extract outer xml', () => {
    const subtitle = safeGetOuterXML(doc, 'subtitle');
    expect(subtitle).toEqual('<subtitle>Ode <i>an</i> die Freude</subtitle>');
  });

  it('extract inner xml', () => {
    const subtitle = safeGetInnerXML(doc, 'subtitle');
    expect(subtitle).toEqual('Ode <i>an</i> die Freude');
  });

  it('understands direct children named', () => {
    const body = getElementByTagName(doc, 'body');
    const children = getChildrenByTagName(body, 'poem');
    expect(children.length).toEqual(2);
    children.forEach(c => {
      expect(tagName(c)).toEqual('poem');
    });

    const allChildren = getChildrenByTagNames(body, ['poem', 'prose']);
    expect(allChildren.length).toEqual(3);
    expect(tagName(allChildren[0])).toEqual('poem');
    expect(tagName(allChildren[1])).toEqual('prose');
    expect(tagName(allChildren[2])).toEqual('poem');
  });

  it('understands direct children in order', () => {
    const body = getElementByTagName(doc, 'body');
    const children = getChildren(body, 'poem');
    expect(children.length).toEqual(3);
    expect(tagName(children[0])).toEqual('poem');
    expect(tagName(children[1])).toEqual('prose');
    expect(tagName(children[2])).toEqual('poem');
  });

  it('understands multiple children', () => {
    const work = getElementByTagName(doc, 'work');
    const body = getElementByTagName(doc, 'body');
    expect(body).not.toBeNull();
    const children = getElementsByTagName(body, 'poem');
    expect(children).not.toBeNull();
    expect(children.length).toEqual(2);
    children.forEach(c => {
      expect(tagName(c)).toEqual('poem');
    });
  });

  it('understands multiple children of different type', () => {
    const work = getElementByTagName(doc, 'work');
    const body = getElementByTagName(doc, 'body');
    expect(body).not.toBeNull();
    const children = getElementsByTagNames(body, ['poem', 'prose']);
    expect(children).not.toBeNull();
    expect(children.length).toEqual(3);
  });
});
