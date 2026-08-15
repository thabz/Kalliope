const sortableYear = (year) => {
  let result = year.replace('ca.', '').replace('c.', '').trim();
  if (result[0] === '-') {
    result = 9999 + parseInt(result); // Sorter omvendt
    result = '-' + result; // Men før de positive
  }
  return result;
};

const workSortDate = (work) => work.year ?? work.published;

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
        const aDate = workSortDate(a);
        const bDate = workSortDate(b);
        const aKey = aDate == null ? a.title : sortableYear(aDate) + a.id;
        const bKey = bDate == null ? b.title : sortableYear(bDate) + b.id;
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
