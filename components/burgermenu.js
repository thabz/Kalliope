import React, { useContext, useState } from 'react';
import CommonData from '../common/commondata.js';
import LangContext from '../common/LangContext.js';
import { Link } from '../routes';
import { BurgerSVG, CrossSVG } from './icons.js';
import * as Links from './links.js';

const MenuLink = (props) => {
  const { url, title, close } = props;

  return (
    <div>
      {url != null ? (
        <Link route={url} onClick={close}>
          <a title={title}>{title}</a>
        </Link>
      ) : (
        title
      )}
    </div>
  );
};

const Menu = (props) => {
  const { items, crumbs, selected, close } = props;
  const itemsRendered = items.map((item) => {
    const { id, url, title } = item;
    return <MenuLink url={url} title={title} close={close} key={url + id} />;
  });
  const crumbsRendered = crumbs.map((crumb) => {
    const { url, title } = crumb;
    return <MenuLink url={url} title={title} close={close} key={url} />;
  });

  const onBackgroundClick = (e) => {
    close();
    e.preventDefault();
  };

  return (
    <div
      style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      onClick={onBackgroundClick}
    >
      <div className="container">
        <CrossSVG
          onClick={close}
          className="close-button"
          color={CommonData.linkColor}
        />
        {crumbsRendered}
        <div className="spacer" />
        {itemsRendered}
        <style jsx>{`
          :global(.close-button) {
            position: absolute;
            right: 10px;
            top: 10px;
            width: 28px;
            height: 28px;
          }
          .spacer {
            border-bottom: 1px solid #888;
            margin: 20px 0;
          }
          .container {
            border: 1px solid #ccc;
            position: absolute;
            right: 7px;
            top: 3px;
            padding: 10px;
            line-height: 40px;
            width: 50vw;
            background: white;
            box-shadow: 2px 2px 10px #888;
          }
        `}</style>
      </div>
    </div>
  );
};

const BurgerMenu = (props) => {
  const [show, setShow] = useState(false);
  const lang = useContext(LangContext);

  const onClick = () => {
    setShow(!show);
  };

  const doClose = () => {
    setShow(false);
  };

  return (
    <>
      <div
        style={{
          marginTop: '10px',
          marginBottom: '30px',
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          alignItems: 'center',
        }}
      >
        <Link route={Links.frontPageURL(lang)}>
          <a title="Gå til forsiden">
            <h2 style={{ fontWeight: 300, padding: 0, margin: 0 }}>Kalliope</h2>
          </a>
        </Link>
        <BurgerSVG
          onClick={onClick}
          inactive={show}
          color={CommonData.linkColor}
        />
        {show ? <Menu {...props} close={doClose} /> : null}
      </div>
    </>
  );
};

export default BurgerMenu;
