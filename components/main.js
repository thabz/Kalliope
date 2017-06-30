import React from 'react';

export default class Main extends React.Component {
  render() {
    return (
      <div>
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
