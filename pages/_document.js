// ./pages/_document.js
import Document, { Head, Main, NextScript } from 'next/document';
import flush from 'styled-jsx/server';

export default class MyDocument extends Document {
  static getInitialProps({ renderPage, asPath }) {
    const { html, head, errorHtml, chunks } = renderPage();
    // TODO: Get all supported langs from somewhere...
    let lang = 'da';
    if (asPath.match(/^\/da\//)) {
      lang = 'da';
    } else if (asPath.match(/^\/en\//)) {
      lang = 'en';
    }

    const styles = flush();
    return { lang, html, head, errorHtml, chunks, styles };
  }

  render() {
    return (
      <html lang={this.props.lang}>
        <Head>
          <style>{`body { margin: 0 } /* custom! */`}</style>
        </Head>
        <body>
          <Main />
          <NextScript />
          <script src="/static/register-sw.js" />
        </body>
      </html>
    );
  }
}
