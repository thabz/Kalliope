// @flow

import React from 'react';
import type { Node } from 'react';
import type { Poet } from '../common/types.js';
import { poetNameString } from './poetname-helpers.js';

const Popup = () => {
  return null;
};

const Label = (props: { children: Node }) => {
  return <div>{props.children}</div>;
};

type HelpKalliopeProps = {
  unknownOriginalBy?: Poet,
};
const HelpKalliope = (props: HelpKalliopeProps) => {
  const { unknownOriginalBy } = props;
  if (unknownOriginalBy != null) {
    const poet = unknownOriginalBy;
    const message = (
      <>
        Denne tekst er en oversættelse af en tekst af $
        {poetNameString(poet, false, true)}. Hvis du kender eller har fundet
        originalen må du gerne skrive til{' '}
        <a mailto="mailto:jesper@kalliope.org">jesper@kalliope.org</a>.
      </>
    );
    return (
      <Popup message={message}>
        <Label>Hjælp Kalliope</Label>
      </Popup>
    );
  } else {
    //
  }
};
export default HelpKalliope;
