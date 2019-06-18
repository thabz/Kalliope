// @flow
import React from 'react';

type HeadingProps = {
  title: any,
  image?: string,
};
export default class Heading extends React.Component<HeadingProps> {
  render() {
    const { title, image } = this.props;
    let imageRendered = null;
    let headingClassName = 'heading';
    if (image != null) {
      imageRendered = <img src={image} className="heading-image" />;
      headingClassName += ' padded-heading';
    }
    return (
      <div className={headingClassName}>
        {imageRendered}
        <h1>{title}</h1>
        <style jsx>{`
          .heading {
            display: flex;
            align-items: center;
          }

          .heading :global(h1) {
            margin: 0;
            width: 100%;
            line-height: 48px;
            font-size: 48px;
            font-weight: lighter;
            transition: font-size 0.2s;
          }
          .padded-heading :global(h1) {
            padding-left: 20px;
          }

          .heading :global(h1):global(.lighter) {
            color: #757575;
          }

          .heading :global(img) {
            flex-basis: 80px;
            height: 80px;
            border-radius: 40px;
            box-shadow: 4px 4px 12px #aaa;
          }

          @media (max-width: 850px) {
            .heading :global(h1) {
              line-height: 44px;
              font-size: 44px;
            }
          }

          @media (max-width: 800px) {
            .heading :global(h1) {
              line-height: 38px;
              font-size: 38px;
            }
          }

          @media (max-width: 700px) {
            .heading :global(h1) {
              line-height: 32px;
              font-size: 32px;
            }
          }

          @media (max-width: 600px) {
            .heading :global(h1) {
              line-height: 28px;
              font-size: 28px;
            }
          }

          @media (max-width: 480px) {
            .heading :global(h1) {
              padding-top: 10px;
              line-height: 22px;
              font-size: 22px;
            }
          }
          @media (max-width: 320px) {
            .heading :global(h1) {
              padding-top: 10px;
              line-height: 18px;
              font-size: 18px;
            }
          }
          @media print {
            .heading :global(h1) {
              font-size: 24px;
              border-bottom: 1px solid #888;
            }
            .heading {
              margin-bottom: 40px;
            }
          }
        `}</style>
      </div>
    );
  }
}
