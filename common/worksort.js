const sortableYear = (year) => {
  let result = year.replace('ca.', '').replace('c.', '').trim();
  if (result[0] === '-') {
    result = 9999 + parseInt(result); // Sorter omvendt
    result = '-' + result; // Men før de positive
  }
  return result;
};

const sortWorks = (poet, works) => {
  if (poet.id === 'bibel') {
    return [...works];
  } else {
    return [...works].sort((a, b) => {
      if (a.id === 'andre') {
        return 1;
      } else if (b.id === 'andre') {
        return -1;
      } else {
        const aKey =
          a.year == null || a.year === '?'
            ? a.title
            : sortableYear(a.year) + a.id;
        const bKey =
          b.year == null || b.year === '?'
            ? b.title
            : sortableYear(b.year) + b.id;
        return aKey > bKey ? 1 : -1;
      }
    });
  }
};

module.exports = {
  sortWorks,
};
