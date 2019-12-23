// @flow
import React from 'react';
import type { Lang } from './types.js';

const LangContext = React.createContext<Lang>('da');
export default LangContext;
