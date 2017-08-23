import React from 'react';
import Overlay from './overlay.js';
import { Link, Router } from '../routes';

export default class Main extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = { overlayType: null, overlayId: null };
  }
  componentDidMount() {
    Router.onRouteChangeStart = url => {
      console.log('App is changing to: ', url);
      const { overlayType, overlayId } = Router.query;
      console.log('Overlay id is', overlayId);
      this.setState({ overlayType, overlayId });
    };
  }

  componentDidUpdate() {
    console.log('Updating with state', this.state);
  }

  render() {
    const { overlayType, overlayId } = this.state;

    let overlay = null;
    if (overlayType != null) {
      overlay = <Overlay>Something</Overlay>;
    }

    return (
      <div>
        {overlay}
        {this.props.children}
        <style jsx>{`
          div {
            max-width: 880px;
            margin: 0px auto;
            padding: 0 20px;
          }
        `}</style>
      </div>
    );
  }
}
