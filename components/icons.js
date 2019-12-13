// @flow
import React from 'react';

type SVGProps = {
  onClick: MouseEvent => void,
  inactive?: boolean,
};

export class LeftArrow extends React.Component<SVGProps> {
  render() {
    const { onClick, inactive } = this.props;
    const strokeColor = inactive == true ? '#888' : 'black';
    const className = inactive == true ? 'inactive' : 'active';
    return (
      <svg width="30" height="30" onClick={onClick} className={className}>
        <circle
          className="icon-background"
          cx="15"
          cy="15"
          r="14"
          fill="white"
          stroke="black"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="8"
          y1="15"
          x2="22"
          y2="15"
          strokeWidth="1"
          stroke={strokeColor}
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="15"
          y1="9"
          x2="8"
          y2="15"
          strokeWidth="1"
          stroke={strokeColor}
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="15"
          y1="21"
          x2="8"
          y2="15"
          strokeWidth="1"
          stroke={strokeColor}
          vectorEffect="non-scaling-stroke"
        />
        <circle
          className="button-overlay"
          cx="15"
          cy="15"
          r="14"
          fill="transparent"
        />
      </svg>
    );
  }
}
export class RightArrow extends React.Component<SVGProps> {
  render() {
    const { onClick, inactive } = this.props;
    const strokeColor = inactive == true ? '#888' : 'black';
    const className = inactive == true ? 'inactive' : 'active';
    return (
      <svg width="30" height="30" onClick={onClick} className={className}>
        <circle
          className="icon-background"
          cx="15"
          cy="15"
          r="14"
          fill="white"
          stroke="black"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="8"
          y1="15"
          x2="22"
          y2="15"
          strokeWidth="1"
          stroke={strokeColor}
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="15"
          y1="9"
          x2="22"
          y2="15"
          strokeWidth="1"
          stroke={strokeColor}
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="15"
          y1="21"
          x2="22"
          y2="15"
          strokeWidth="1"
          stroke={strokeColor}
          vectorEffect="non-scaling-stroke"
        />
        <circle
          className="button-overlay"
          cx="15"
          cy="15"
          r="14"
          fill="transparent"
        />
      </svg>
    );
  }
}

export class CloseButton extends React.Component<SVGProps> {
  render() {
    const { onClick } = this.props;
    return (
      <svg width="30" height="30" onClick={onClick} className="active">
        <circle
          className="icon-background"
          cx="15"
          cy="15"
          r="14"
          fill="white"
          stroke="black"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="9"
          y1="9"
          x2="21"
          y2="21"
          strokeWidth="1"
          stroke="black"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="21"
          y1="9"
          x2="9"
          y2="21"
          strokeWidth="1"
          stroke="black"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          className="button-overlay"
          cx="15"
          cy="15"
          r="14"
          fill="transparent"
        />
      </svg>
    );
  }
}
