import {
  safeGetText,
  safeGetAttr,
  getChildNode,
  findChildNodes,
  tagName,
  safeGetOuterXML,
  loadXMLDoc,
} from '../tools/build-static/xml.js';

describe('XML parser', () => {
  const doc = loadXMLDoc('__tests__/xml.xml');
  it('read a file', () => {
    expect(doc).not.toBeNull();
  });

  it('get direct child', () => {
    const work = getChildNode(doc, 'subtitle');
    expect(work).not.toBeNull();
  });

  it('understands tag-names', () => {
    const name = tagName(getChildNode(doc, 'title'));
    expect(name).toEqual('title');
  });

  it('get attribute value', () => {
    const work = getChildNode(doc, 'work');
    const author = safeGetAttr(work, 'author');
    expect(author).toEqual('baggesen');
  });

  it('extract text', () => {
    const title = safeGetText(doc, 'title');
    expect(title).toEqual('Ode');
  });

  it('extract xml', () => {
    const subtitle = safeGetOuterXML(doc, 'subtitle');
    expect(subtitle).toEqual('<subtitle>Ode <i>an</i> die Freude</subtitle>');
  });

  it('understands multiple children', () => {
    const work = getChildNode(doc, 'work');
    const body = getChildNode(doc, 'body');
    expect(body).not.toBeNull();
    const children = findChildNodes(body, 'c');
    expect(children).not.toBeNull();
    expect(children.length).toEqual(3);
  });
});
