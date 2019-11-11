// @flow
import React, { useContext } from 'react';
import type { Node } from 'react';
import { Link } from '../routes';
import * as Strings from '../pages/helpers/strings.js';
import _ from '../pages/helpers/translations.js';
import CommonData from '../pages/helpers/commondata.js';
import type {
  Lang,
  Country,
  Section,
  Poet,
  SortReturn,
  SectionForRendering,
  Error,
} from '../pages/helpers/types.js';
import LangContext from '../pages/helpers/LangContext.js';

function joinWithCommaAndOr(items: Array<string | Node>, andOrWord: string) {
  const result = [];
  items.forEach((item, i) => {
    result.push(item);
    if (i == items.length - 2) {
      result.push(' ' + andOrWord + ' ');
    } else if (i < items.length - 2) {
      result.push(
        <span key={i} style={{ marginLeft: '-0.25em' }}>
          ,{' '}
        </span>
      );
    }
  });
  return result;
}

type CountryPickerProps = {
  countryToURL: Country => string,
  selectedCountry: Country,
  style: {},
};
const CountryPicker = (props: CountryPickerProps) => {
  const { selectedCountry, countryToURL, style } = props;
  const lang = useContext(LangContext);
  const items = CommonData.countries.map(country => {
    const url = countryToURL(country.code);
    const adj = country.adjective[lang] + ' ';
    if (country.code === selectedCountry) {
      return <b key={country.code}>{adj}</b>;
    } else {
      return (
        <Link route={url} key={country.code}>
          <a>{adj}</a>
        </Link>
      );
    }
  });
  const joinedItems = joinWithCommaAndOr(items, _('eller', lang));
  return (
    <div style={style}>
      <div>
        {_('Skift mellem', lang)} {joinedItems}
        {_('digtere', lang)}.
      </div>
    </div>
  );
};

export default CountryPicker;
