// @flow
import React, { Component } from 'react';
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

function joinWithCommaAndOr(
  items: Array<string | React$Element<*>>,
  andOrWord
) {
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
  lang: Lang,
  countryToURL: Country => string,
  selectedCountry: Country,
  style: any,
};
export default class CountryPicker extends React.Component<CountryPickerProps> {
  render() {
    const { lang, selectedCountry, countryToURL, style } = this.props;
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
  }
}
