// ./pages/_document.js
import Document, { Head, Html, Main, NextScript } from 'next/document';
import { matchRoute } from '../routes';

const pathnameFrom = (asPath) => asPath.split(/[?#]/, 1)[0];

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    const { asPath } = ctx;
    const route = matchRoute(pathnameFrom(asPath));
    const lang = route == null ? 'da' : route.query.lang;

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
          <script src="/register-sw.js" />
        </body>
      </Html>
    );
  }
}
