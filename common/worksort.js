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
      const trailingRank = work => {
        if (work.virtualType === 'anthology' || work.id === 'antologier') {
          return 2;
        } else if (work.id === 'andre') {
          return 1;
        }
        return 0;
      };
      const rankDifference = trailingRank(a) - trailingRank(b);
      if (rankDifference !== 0) {
        return rankDifference;
      } else {
        const aKey = a.year == null ? a.title : sortableYear(a.year) + a.id;
        const bKey = b.year == null ? b.title : sortableYear(b.year) + b.id;
        return aKey > bKey ? 1 : -1;
      }
    });
  }
};

export {
  sortWorks,
};

export default {
  sortWorks,
};
