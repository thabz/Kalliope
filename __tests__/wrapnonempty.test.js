import React from 'react';
import WrapNonEmpty from '../components/wrapnonempty.js';

describe('WrapNonEmpty', () => {
  it('returns null for empty children', () => {
    expect(WrapNonEmpty({ children: null })).toBeNull();
    expect(WrapNonEmpty({ children: [] })).toBeNull();
  });

  it('wraps non-empty children in a div', () => {
    const result = WrapNonEmpty({
      id: 'wrapper',
      children: <span>Hej</span>,
    });

    expect(result.type).toBe('div');
    expect(result.props.id).toBe('wrapper');
    expect(React.Children.toArray(result.props.children)).toHaveLength(1);
  });
});
