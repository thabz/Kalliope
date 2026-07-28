const Tooltip = ({
  ariaLabel,
  children,
  focusable = false,
  placement = 'above',
  text,
}) => {
  return (
    <span
      className={`tooltip ${placement}${
        focusable === true ? ' focusable' : ''
      }`}
      data-tooltip={text}
      aria-label={ariaLabel}
      tabIndex={focusable === true ? 0 : undefined}>
      {children}
      <style jsx>{`
        .tooltip {
          display: inline-block;
          position: relative;
        }
        .tooltip.focusable {
          cursor: help;
        }
        .tooltip::before {
          background: #000;
          border-radius: 4px;
          bottom: calc(100% + 7px);
          color: #fff;
          content: attr(data-tooltip);
          font-size: 0.8rem;
          left: 50%;
          line-height: 1.3;
          opacity: 0;
          padding: 5px 8px;
          pointer-events: none;
          position: absolute;
          transform: translate(-50%, 3px);
          transition:
            opacity 120ms ease,
            transform 120ms ease;
          visibility: hidden;
          white-space: nowrap;
          z-index: 1;
        }
        .tooltip::after {
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid #000;
          bottom: calc(100% + 2px);
          content: '';
          left: 50%;
          opacity: 0;
          pointer-events: none;
          position: absolute;
          transform: translateX(-50%);
          visibility: hidden;
          z-index: 1;
        }
        .tooltip.below::before {
          bottom: auto;
          top: calc(100% + 7px);
          transform: translate(-50%, -3px);
        }
        .tooltip.below::after {
          border-bottom: 5px solid #000;
          border-top: 0;
          bottom: auto;
          top: calc(100% + 2px);
        }
        .tooltip:hover::before,
        .tooltip:focus-within::before {
          opacity: 1;
          transform: translate(-50%, 0);
          visibility: visible;
        }
        .tooltip:hover::after,
        .tooltip:focus-within::after {
          opacity: 1;
          visibility: visible;
        }
      `}</style>
    </span>
  );
};

export default Tooltip;
