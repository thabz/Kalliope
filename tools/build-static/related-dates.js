// Both sides of a date relation must be rebuilt when its membership or labels change.
export const changedDateTextIds = (previousDates, currentDates) => {
  const affectedIds = new Set();
  const dateKeys = new Set([...previousDates.keys(), ...currentDates.keys()]);
  dateKeys.forEach(date => {
    const previous = previousDates.get(date) ?? [];
    const current = currentDates.get(date) ?? [];
    if (JSON.stringify(previous) === JSON.stringify(current)) {
      return;
    }
    [...previous, ...current].forEach(item => affectedIds.add(item.id));
  });
  return affectedIds;
};
