import { loadXMLDoc } from '../tools/libs/helpers.js';
import {
  safeGetText,
  safeGetAttr,
  getChildNode,
  findChildNodes,
  tagName,
} from '../tools/build-static/xml.js';

describe('XML parser', () => {
  const doc = loadXMLDoc('__tests__/xml.xml');
  it('read a file', () => {
    expect(doc).not.toBeNull();
  });

  it('extract text', () => {
    const title = safeGetText(doc, 'title');
    expect(title).toEqual('Ode');
  });

  it('extract xml', () => {
    const subtitle = safeGetText(doc, 'subtitle');
    expect(subtitle).toEqual('Ode <i>an</i> die Freude');
  });

  it('understands tag-names', () => {
    const name = tagName(getChildNode(doc, 'title'));
    expect(name).toEqual('title');
  });

  //   it('get direct child', () => {
  //     const work = findChildNodes(doc, 'head');
  //     expect(work).not.toBeNull();
  //   });

  //   it('understands multiple children', () => {
  //     const work = getChildNode(doc, 'work');
  //     const body = getChildNode(doc, 'body');
  //     expect(body).not.toBeNull();
  //     const children = findChildNodes(body, 'c');
  //     expect(children).not.toBeNull();
  //     console.log('xxxx', children);
  //     //expect(children.length).toEqual(3);
  //   });
});
