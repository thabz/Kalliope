// Use poetname.js:poetNameString instead when node.js uses modules
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
  let yearPart = '';
  if (year && year !== '?') {
    yearPart = ` (${year})`;
  }
  return title + yearPart;
};

const workLinkName = work => {
  const { linktitle, year } = work;
  let yearPart = '';
  if (year && year !== '?') {
    yearPart = ` (${year})`;
  }
  return linktitle + yearPart;
};

module.exports = {
  poetName,
  workName,
  workLinkName,
};
