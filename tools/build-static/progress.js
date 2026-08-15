const createProgressReporter = (
  label,
  interval = 1000,
  logger = console.log
) => {
  let count = 0;

  return {
    increment() {
      count += 1;
      if (count % interval === 0) {
        logger(`${label}: ${count}`);
      }
    },
    finish() {
      if (count > 0 && count % interval !== 0) {
        logger(`${label}: ${count} (færdig)`);
      }
    },
  };
};

export {
  createProgressReporter,
};
