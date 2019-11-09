import React, { useState } from 'react';
import App from 'next/app';
import LangContext from './helpers/LangContext.js';

const KalliopeAppFunc = props => {
  const { Component, pageProps } = props;
  const { lang } = pageProps;

  return (
    <LangContext.Provider value={lang}>
      <Component {...pageProps} />
    </LangContext.Provider>
  );
};

class KalliopeApp extends App {
  render() {
    return <KalliopeAppFunc {...this.props} />;
  }
}

export default KalliopeApp;
