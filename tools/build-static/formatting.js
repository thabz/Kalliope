// Use poetname.js:poetNameString instead when node.js uses modules
const { formatTitleAndYear } = require('../../common/dates.js');

const poetName = poet => {
  if (poet == null) {
    throw 'poetName called with null poet';
  }
  const { name } = poet;
  const { firstname, lastname } = name;
  if (lastname) {
    if (firstname) {
      namePart = `${firstname} ${lastname}`;
    } else {
      namePart = lastname;
    }
  } else {
    namePart = firstname;
  }
  return namePart;
};

// Use workname.js: workTitleString instead when node.js uses modules
const workName = work => {
  const { title, year } = work;
  return formatTitleAndYear(title, year);
};

const workLinkName = work => {
  const { linktitle, year } = work;
  return formatTitleAndYear(linktitle, year);
};

module.exports = {
  poetName,
  workName,
  workLinkName,
};
