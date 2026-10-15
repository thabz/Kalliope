import { jest } from '@jest/globals';
import { listenForListNavigation } from '../components/sectionedlist-navigation.js';

describe('sectioned list keyboard navigation', () => {
  let target, headings, items, itemElements, cleanup;

  const press = (key, options = {}) => {
    const event = new Event('keydown', { cancelable: true });
    Object.assign(event, { key, ...options });
    target.dispatchEvent(event);
    return event;
  };

  const type = (text) => {
    for (const key of text) press(key);
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(10000);
    target = new EventTarget();
    headings = new Map(
      ['A', 'B', 'E', 'Æ', 'Ø', 'Å'].map((letter) => [
        letter,
        { scrollIntoView: jest.fn() },
      ])
    );
    items = [
      { searchText: 'Baggesen, Jens' },
      { searchText: 'Blicher, Steen Steensen' },
      { searchText: 'Blicher, Ernest' },
      { searchText: 'Blomster i en have' },
      { searchText: 'Blomster om natten' },
      { searchText: 'Ewald, Johannes' },
      { searchText: 'Æbletræet' },
      { searchText: 'Ørsted' },
      { searchText: 'Årstider' },
      { searchText: 'Aakjær, Jeppe' },
      { searchText: 'Én rose' },
      { id: 'without-search-text' },
    ];
    itemElements = new Map(
      items.map((item) => [item, { scrollIntoView: jest.fn() }])
    );
    cleanup = listenForListNavigation(
      target,
      [{ items: items.slice(0, 5) }, { items: items.slice(5) }],
      headings,
      itemElements
    );
  });

  afterEach(() => {
    cleanup();
    jest.useRealTimers();
  });

  const expectScrolledToItem = (index) => {
    expect(itemElements.get(items[index]).scrollIntoView).toHaveBeenCalled();
  };

  it('keeps the first letter heading jump and refines to the first matching item', () => {
    expect(press('b').defaultPrevented).toBe(true);
    expect(headings.get('B').scrollIntoView).toHaveBeenCalledTimes(1);
    expect(itemElements.get(items[0]).scrollIntoView).not.toHaveBeenCalled();

    press('l');
    expectScrolledToItem(1);
    type('om');
    expectScrolledToItem(3);
    expect(itemElements.get(items[2]).scrollIntoView).not.toHaveBeenCalled();
  });

  it('matches regardless of case', () => {
    type('bLiCH');
    expectScrolledToItem(1);
  });

  it('matches items in later sections', () => {
    type('ew');
    expectScrolledToItem(5);
  });

  it.each([
    ['æb', 6],
    ['ør', 7],
    ['år', 8],
    ['aa', 9],
    ['Én', 10],
    ['E\u0301n', 10],
  ])('matches Danish letters and Unicode text: %s', (text, index) => {
    type(text);
    expectScrolledToItem(index);
  });

  it('does not fold Æ, Ø or Å into other letters', () => {
    type('ar');
    press('Escape');
    type('or');
    press('Escape');
    type('ab');
    for (const index of [6, 7, 8]) {
      expect(itemElements.get(items[index]).scrollIntoView).not.toHaveBeenCalled();
    }
  });

  it('allows a full second between successive keys', () => {
    press('b');
    jest.advanceTimersByTime(1000);
    press('l');
    jest.advanceTimersByTime(1000);
    press('o');
    expectScrolledToItem(3);
  });

  it('starts a new heading jump after more than a second', () => {
    type('bl');
    jest.advanceTimersByTime(1001);
    press('e');
    expect(headings.get('E').scrollIntoView).toHaveBeenCalledTimes(1);
    press('w');
    expectScrolledToItem(5);
  });

  it.each(['Escape', 'blur'])('resets the search on %s', (resetEvent) => {
    type('bl');
    if (resetEvent === 'blur') {
      target.dispatchEvent(new Event('blur'));
    } else {
      press(resetEvent);
    }
    type('ew');
    expect(headings.get('E').scrollIntoView).toHaveBeenCalledTimes(1);
    expectScrolledToItem(5);
  });

  it('keeps an unmatched prefix without scrolling or falling back to a single letter', () => {
    type('bz');
    press('e');
    expect(headings.get('E').scrollIntoView).not.toHaveBeenCalled();
    for (const element of itemElements.values()) {
      expect(element.scrollIntoView).not.toHaveBeenCalled();
    }
  });

  it('ignores an initial space and accepts spaces within a prefix', () => {
    expect(press(' ').defaultPrevented).toBe(false);
    type('blomster');
    expect(press(' ').defaultPrevented).toBe(true);
    press('o');
    expectScrolledToItem(4);
  });

  it.each([
    { altKey: true },
    { ctrlKey: true },
    { metaKey: true },
    { isComposing: true },
    { repeat: true },
  ])('ignores modified, composing and repeated keys: %j', (options) => {
    expect(press('b', options).defaultPrevented).toBe(false);
    expect(headings.get('B').scrollIntoView).not.toHaveBeenCalled();
    type('ew');
    expectScrolledToItem(5);
  });

  it('ignores keys already handled by another listener', () => {
    const event = new Event('keydown', { cancelable: true });
    event.key = 'b';
    event.preventDefault();
    target.dispatchEvent(event);
    expect(headings.get('B').scrollIntoView).not.toHaveBeenCalled();
    type('ew');
    expectScrolledToItem(5);
  });

  it.each([
    { tagName: 'INPUT' },
    { tagName: 'TEXTAREA' },
    { tagName: 'SELECT' },
    { isContentEditable: true },
  ])('preserves typing in editable elements: %j', (element) => {
    const event = new Event('keydown', { cancelable: true });
    Object.defineProperty(event, 'target', { value: element });
    event.key = 'b';
    target.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(headings.get('B').scrollIntoView).not.toHaveBeenCalled();
    type('ew');
    expectScrolledToItem(5);
  });

  it('leaves navigation keys alone', () => {
    for (const key of ['Tab', 'Enter', 'ArrowDown', 'Backspace']) {
      expect(press(key).defaultPrevented).toBe(false);
    }
    type('ew');
    expectScrolledToItem(5);
  });

  it('removes listeners and starts afresh when the list is replaced', () => {
    type('bl');
    cleanup();
    expect(press('e').defaultPrevented).toBe(false);
    expect(headings.get('E').scrollIntoView).not.toHaveBeenCalled();

    const replacement = { searchText: 'Ewald' };
    const element = { scrollIntoView: jest.fn() };
    cleanup = listenForListNavigation(
      target,
      [{ items: [replacement] }],
      headings,
      new Map([[replacement, element]])
    );
    type('ew');
    expect(headings.get('E').scrollIntoView).toHaveBeenCalledTimes(1);
    expect(element.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(itemElements.get(items[5]).scrollIntoView).not.toHaveBeenCalled();
  });
});
