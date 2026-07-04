import { formattedYearRange } from './formatteddate.js';

const nvl = (x, v) => {
  return x == null ? v : x;
};

export function poetNameParts(
  poet,
  lastNameFirst = false,
  includePeriod = false,
  lang = 'da'
) {
  const { name } = poet;
  const { firstname, lastname } = name;

  let namePart = null;
  let periodPart = null;

  if (lastname != null) {
    if (firstname != null) {
      if (lastNameFirst) {
        namePart = `${lastname}, ${firstname}`;
      } else {
        namePart = `${firstname} ${lastname}`;
      }
    } else {
      namePart = lastname;
    }
  } else {
    namePart = firstname;
  }

  if (includePeriod && poet.period != null) {
    const { born, dead } = poet.period;
    periodPart = formattedYearRange(
      nvl(born, {}).date,
      nvl(dead, {}).date,
      lang
    );
  }
  return [namePart, periodPart];
}

export function poetNameString(
  poet,
  lastNameFirst = false,
  includePeriod = false,
  lang = 'da'
) {
  const p = poetNameParts(poet, lastNameFirst, includePeriod, lang);
  if (p[0] != null && p[1] != null) {
    return p[0] + ' ' + p[1];
  } else if (p[0] != null) {
    return p[0];
  } else {
    return '';
  }
}

export const navnMedEjefald = (navn) => {
  if (navn == null) {
    return null;
  }
  if (navn.match(/[szx]$/)) {
    return `${navn}’`;
  } else {
    return `${navn}s`;
  }
};

export function poetLastNameString(poet) {
  const { firstname, lastname } = poet.name;
  return nvl(lastname, nvl(firstname, 'Ukendt'));
}

export function poetGenetiveLastName(poet, lang) {
  const { firstname, lastname } = poet.name;
  let name = nvl(lastname, nvl(firstname, 'Ukendt'));

  const danskEjefald = (navn) => {
    if (navn.match(/[szx]$/)) {
      return `${navn}’`;
    }
    return `${navn}s`;
  };

  const engelskEjefald = (navn) => {
    if (navn.match(/s$/i)) {
      return `${navn}’`;
    }
    return `${navn}’s`;
  };

  const tyskEjefald = (navn) => {
    return `von ${navn}`;
  };

  const franskEjefald = (navn) => {
    const leadingElision = navn.match(/^d['’](.+)$/i);
    if (leadingElision != null) {
      return `d’${leadingElision[1]}`;
    }
    if (navn.match(/^[aeiouyàâäéèêëîïôöùûüÿæœ]/i)) {
      return `d’${navn}`;
    }
    return `de ${navn}`;
  };

  if (lang === 'da') {
    return danskEjefald(name);
  } else if (lang === 'en') {
    return engelskEjefald(name);
  } else if (lang === 'de') {
    return tyskEjefald(name);
  } else if (lang === 'fr') {
    return franskEjefald(name);
  } else {
    throw `Ukendt sprog: ${lang}`;
  }
}
