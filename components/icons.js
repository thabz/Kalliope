// @flow
import React from 'react';

type SVGProps = {
  onClick: MouseEvent => void,
  inactive?: boolean,
  className?: string,
  color?: string,
};

export const BurgerSVG = (props: SVGProps) => {
  const { onClick, inactive, className, color = 'black' } = props;
  const strokeColor = inactive == true ? '#888' : color;
  let extraClassName = inactive == true ? 'inactive' : 'active';
  if (className != null) {
    extraClassName += ' ' + className;
  }
  const style = {
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: '1px',
    fill: 'none',
    stroke: color,
  };
  return (
    <svg
      width="30"
      height="30"
      style={style}
      onClick={onClick}
      className={extraClassName}>
      <line
        style={style}
        x1="4"
        y1="8"
        x2="26"
        y2="8"
        vectorEffect="non-scaling-stroke"
      />
      <line
        style={style}
        x1="4"
        y1="15"
        x2="26"
        y2="15"
        vectorEffect="non-scaling-stroke"
      />
      <line
        style={style}
        x1="4"
        y1="22"
        x2="26"
        y2="22"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

export class LeftArrow extends React.Component<SVGProps> {
  render() {
    const { onClick, inactive, color = 'black' } = this.props;
    const strokeColor = inactive == true ? '#888' : color;
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
    const { onClick, inactive, color = 'black' } = this.props;
    const strokeColor = inactive == true ? '#888' : color;
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

type LoupeSVGProps = {
  color: string,
};
export class LoupeSVG extends React.Component<LoupeSVGProps> {
  render() {
    const { color } = this.props;
    const style = {
      fill: 'none',
      stroke: color,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeWidth: '1px',
    };
    return (
      <svg viewBox="0 -5 48 53" width="100%" height="100%">
        <ellipse
          style={style}
          cx="19.55"
          cy="19.5"
          rx="18.55"
          ry="18.5"
          vectorEffect="non-scaling-stroke"
        />
        <line
          style={style}
          x1="47"
          x2="32.96"
          y1="47"
          y2="33"
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }
}

export const CrossSVG = (props: SVGProps) => {
  const { onClick, className, color = 'black' } = props;

  const style = {
    fill: 'none',
    stroke: color,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: '1px',
  };
  return (
    <svg
      viewBox="0 -5 48 53"
      width="100%"
      height="100%"
      className={className}
      onClick={onClick}>
      <line
        style={style}
        x1="38"
        y1="38"
        x2="4"
        y2="4"
        vectorEffect="non-scaling-stroke"
      />
      <line
        style={style}
        x1="38"
        y1="4"
        x2="4"
        y2="38"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};
