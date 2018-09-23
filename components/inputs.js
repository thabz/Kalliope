// @flow
import * as React from 'react';

var genUniqueId = (function() {
  var count = 0;
  return function() {
    return 'id' + count++;
  };
})();

type LabelProps = {
  children: React.Node,
  htmlFor: string,
};
class Label extends React.Component<LabelProps> {
  render() {
    const { htmlFor, children } = this.props;
    if (children == null) {
      return null;
    } else {
      return (
        <label htmlFor={htmlFor}>
          {children}
          <style jsx>{`
            label {
              width: 100%;
              font-size: 0.8rem;
              color: #757575;
            }
          `}</style>
        </label>
      );
    }
  }
}

type InputProps = {
  value: string,
  label?: string,
  style?: Object,
  className?: string,
  onChange?: (e: SyntheticInputEvent<HTMLInputElement>) => void,
};
export class Input extends React.Component<InputProps> {
  static defaultProps = {
    onChange: () => {},
    className: '',
  };
  render() {
    const { value, className, style, onChange, label } = this.props;
    let finalClassName = 'text-input';
    if (className != null) {
      finalClassName += ' ' + className;
    }

    const htmlId = genUniqueId();

    return (
      <div style={style}>
        <Label htmlFor={htmlId}>{label}</Label>
        <input
          id={htmlId}
          value={value}
          className={finalClassName}
          style={style}
          onChange={onChange}
        />
        <style jsx>{`
          input.text-input {
            width: 100%;
            font-size: 1.1em;
            padding: 5px;
          }
        `}</style>
      </div>
    );
  }
}

type TextAreaProps = {
  ...InputProps,
  onChange?: (e: SyntheticInputEvent<HTMLTextAreaElement>) => void,
  rows?: number,
  wrap?: 'hard' | 'soft' | 'off',
};
export class TextArea extends React.Component<TextAreaProps> {
  static defaultProps = {
    wrap: 'soft',
    onChange: () => {},
  };
  render() {
    const { value, style, className, wrap, onChange, rows, label } = this.props;
    const htmlId = genUniqueId();

    return (
      <div>
        <Label htmlFor={htmlId}>{label}</Label>
        <textarea
          id={htmlId}
          style={style}
          rows={rows}
          className={className}
          value={value}
          wrap={wrap}
          onChange={onChange}
          spellCheck="false"
          autoComplete="false"
          autoCapitalize="false"
        />
      </div>
    );
  }
}

type ButtonProps = {
  children: React.Node,
  onClick?: (e: SyntheticInputEvent<HTMLButtonElement>) => void,
};
export class Button extends React.Component<ButtonProps> {
  render() {
    const { children, onClick } = this.props;
    return (
      <React.Fragment>
        <button onClick={onClick}>{children}</button>
        <style jsx>{`
          button {
            color: white;
            border-radius: 5px;
            background-color: #282;
            border: 0;
            padding: 5px 20px;
            font-size: 14px;
          }
          button:hover {
            background-color: #171;
            cursor: pointer;
          }
        `}</style>
      </React.Fragment>
    );
  }
}
