import React, { useContext } from 'react';
import Link from 'next/link';
import CommonData from '../common/commondata.js';
import LangContext from '../common/LangContext.js';
import _ from '../common/translations.js';

function joinWithCommaAndOr(items, andOrWord) {
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

const CountryPicker = (props) => {
  const { selectedCountry, countryToURL, style } = props;
  const lang = useContext(LangContext);
  const items = CommonData.countries.map((country) => {
    const url = countryToURL(country.code);
    const adj = country.adjective[lang] + ' ';
    if (country.code === selectedCountry) {
      return <b key={country.code}>{adj}</b>;
    } else {
      return (
        <Link href={url} key={country.code}>
          {adj}
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
