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
    const nonExisting = safeGetAttr(work, 'non-existing-attr');
    expect(nonExisting).toBeNull();
  });

  it('extract text', () => {
    const titleNode = getElementByTagName(doc, 'title');
    const title = safeGetText(titleNode);
    expect(title).toEqual('Ode');
    const nonExisting = getElementByTagName(doc, 'non-existing-child');
    expect(nonExisting).toBeNull();
  });

  it('extract text with HTML entities', () => {
    const proseNode = getElementByTagName(doc, 'prose');
    const prose = safeGetText(proseNode);
    expect(prose).toEqual('Æble');
  });

  it('extract outer xml', () => {
    const subtitle = getElementByTagName(doc, 'subtitle');
    const subtitleOuter = safeGetOuterXML(subtitle);
    expect(subtitleOuter).toEqual(
      '<subtitle>Ode <i>an</i> die Freude</subtitle>'
    );
  });

  it('extract inner xml', () => {
    const subtitle = getElementByTagName(doc, 'subtitle');
    const subtitleInner = safeGetInnerXML(subtitle);
    expect(subtitleInner).toEqual('Ode <i>an</i> die Freude');
    // From a tag with attributes
    const source = getElementByTagName(doc, 'source');
    const sourceInner = safeGetInnerXML(source);
    expect(sourceInner).toEqual('Ingemann: <i>Digte</i>');
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
    const children = getChildren(body);
    expect(children.length).toEqual(4);
    expect(tagName(children[0])).toEqual('poem');
    expect(tagName(children[1])).toEqual('prose');
    expect(tagName(children[2])).toEqual('poem');
    expect(tagName(children[3])).toEqual('section');
  });

  it('understands multiple children', () => {
    const work = getElementByTagName(doc, 'work');
    const body = getElementByTagName(doc, 'body');
    expect(body).not.toBeNull();
    const children = getElementsByTagName(body, 'poem');
    expect(children).not.toBeNull();
    expect(children.length).toEqual(6);
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
    expect(children.length).toEqual(10);
  });

  it('recursive find returns sorted', () => {
    const work = getElementByTagName(doc, 'work');
    const body = getElementByTagName(doc, 'body');
    expect(body).not.toBeNull();
    const children = getElementsByTagNames(body, ['poem', 'prose']);
    expect(children).not.toBeNull();
    expect(children.length).toEqual(10);
    expect(tagName(children[0])).toEqual('poem');
    expect(tagName(children[1])).toEqual('prose');
    expect(tagName(children[2])).toEqual('poem');
    expect(tagName(children[3])).toEqual('poem');
    expect(tagName(children[4])).toEqual('prose');
    expect(tagName(children[5])).toEqual('poem');
    expect(tagName(children[6])).toEqual('prose');
    expect(tagName(children[7])).toEqual('poem');
    expect(tagName(children[8])).toEqual('poem');
    expect(tagName(children[9])).toEqual('prose');
    expect(safeGetAttr(children[0], 'pos')).toEqual('1');
    expect(safeGetAttr(children[1], 'pos')).toEqual('2');
    expect(safeGetAttr(children[2], 'pos')).toEqual('3');
    expect(safeGetAttr(children[3], 'pos')).toEqual('4');
    expect(safeGetAttr(children[4], 'pos')).toEqual('5');
    expect(safeGetAttr(children[5], 'pos')).toEqual('6');
    expect(safeGetAttr(children[6], 'pos')).toEqual('7');
    expect(safeGetAttr(children[7], 'pos')).toEqual('8');
    expect(safeGetAttr(children[8], 'pos')).toEqual('9');
    expect(safeGetAttr(children[9], 'pos')).toEqual('10');
  });

  it('empty is not null', () => {
    const work = getElementByTagName(doc, 'work');
    const body = getElementByTagName(doc, 'bodyx');
    const children = getElementsByTagNames(body, ['poem', 'prose']);
    expect(children).not.toBeNull();
    expect(children).toHaveLength(0);
  });
});
