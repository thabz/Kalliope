import { useEffect } from 'react';
import Router from 'next/router';
import { Paging } from '../components/breadcrumbs.js';

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useEffect: jest.fn(),
}));
jest.mock('next/router', () => ({ push: jest.fn() }));

describe('paging keyboard navigation', () => {
  let cleanup;
  const originalDocument = global.document;
  const originalWindow = global.window;

  beforeEach(() => {
    jest.clearAllMocks();
    global.document = Object.assign(new EventTarget(), {
      body: { classList: {} },
    });
    global.window = { searchFieldHasFocus: false, scrollTo: jest.fn() };
    useEffect.mockImplementation(effect => { cleanup = effect(); });
    Paging({ prev: { url: '/previous' }, next: { url: '/next' } });
  });

  afterEach(() => {
    cleanup();
    global.document = originalDocument;
    global.window = originalWindow;
  });

  const press = (keyCode, options = {}) => {
    const event = Object.assign(new Event('keyup', { cancelable: true }), {
      keyCode,
      ...options,
    });
    document.dispatchEvent(event);
    return event;
  };

  it.each([[37, '/previous'], [39, '/next']])(
    'uses an unmodified arrow (%i) for adjacent content',
    (keyCode, url) => {
      expect(press(keyCode).defaultPrevented).toBe(true);
      expect(Router.push).toHaveBeenCalledWith(url);
      expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    }
  );

  it.each(['metaKey', 'ctrlKey', 'altKey', 'shiftKey'])(
    'leaves modified arrows (%s) to the browser',
    modifier => {
      for (const keyCode of [37, 39]) {
        expect(press(keyCode, { [modifier]: true }).defaultPrevented).toBe(false);
      }
      expect(Router.push).not.toHaveBeenCalled();
      expect(window.scrollTo).not.toHaveBeenCalled();
    }
  );

  it('does not navigate while the search field has focus', () => {
    window.searchFieldHasFocus = true;
    expect(press(37).defaultPrevented).toBe(false);
    expect(Router.push).not.toHaveBeenCalled();
  });

  it('does not navigate after another handler has consumed the event', () => {
    const event = Object.assign(new Event('keyup', { cancelable: true }), {
      keyCode: 37,
    });
    event.preventDefault();
    document.dispatchEvent(event);
    expect(Router.push).not.toHaveBeenCalled();
  });
});
