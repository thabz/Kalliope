// ./pages/_document.js
import Document, { Head, Main, NextScript } from 'next/document';
import flush from 'styled-jsx/server';

export default class MyDocument extends Document {
  static getInitialProps({ renderPage, query: { lang } }) {
    const { html, head, errorHtml, chunks } = renderPage();
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
          <script src="static/register-sw.js" />
        </body>
      </html>
    );
  }
}
