// @flow
import * as React from 'react';

type InputProps = {
  value: string,
  style?: Object,
  className?: string,
  onChange?: () => void,
};
export class Input extends React.Component<InputProps> {
  defaultProps = {
    onChange: () => {},
  };
  render() {
    const { value, className, style, onChange } = this.props;
    return (
      <React.Fragment>
        <input
          value={value}
          className={className}
          style={style}
          onChange={onChange}
        />
        <style jsx>{`
          .input {
            width: 100%;
            font-size: 14px;
          }
        `}</style>
      </React.Fragment>
    );
  }
}

type TextAreaProps = {
  ...InputProps,
  wrap?: 'hard' | 'soft' | 'off',
};
export class TextArea extends React.Component<TextAreaProps> {
  defaultProps = {
    wrap: 'soft',
    onChange: () => {},
  };
  render() {
    const { value, style, className, wrap, onChange } = this.props;
    return (
      <textarea
        style={style}
        className={className}
        value={value}
        wrap={wrap}
        onChange={onChange}
      />
    );
  }
}

type ButtonProps = {
  children: React.Node,
};
export class Button extends React.Component<ButtonProps> {
  render() {
    const { children } = this.props;
    return (
      <React.Fragment>
        <button>{children}</button>
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
