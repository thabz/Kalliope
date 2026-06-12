// ./pages/_document.js
import Document, { Head, Html, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    const { asPath } = ctx;
    // TODO: Get all supported langs from somewhere...
    let lang = 'da';
    if (asPath.match(/^\/da\//)) {
      lang = 'da';
    } else if (asPath.match(/^\/en\//)) {
      lang = 'en';
    }

    return { ...initialProps, lang };
  }

  render() {
    return (
      <Html lang={this.props.lang}>
        <Head>
          <style>{`body { margin: 0 } /* custom! */`}</style>
        </Head>
        <body>
          <Main />
          <NextScript />
          <script src="/static/register-sw.js" />
        </body>
      </Html>
    );
  }
}
