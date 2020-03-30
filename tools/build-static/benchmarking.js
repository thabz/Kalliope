let b_keys = [];
let b_millis = {};
// Benchmarking
const b = async (name, f, args) => {
  console.log(`${name}...`);
  const beforeMillis = Date.now();
  const result = f(args);
  const afterMillis = Date.now();
  if (b_millis[name] == null) {
    b_keys.push(name);
    b_millis[name] = 0;
  }
  b_millis[name] = b_millis[name] + afterMillis - beforeMillis;
  return result;
};
const print_benchmarking_results = () => {
  let sum = 0;
  console.log('\nSTATS');
  b_keys.forEach(key => {
    const millis = b_millis[key];
    sum += millis;
    console.log(`${key}: ${millis}ms`);
  });
  console.log(`SUM: ${sum}ms`);
};

module.exports = {
  b,
  print_benchmarking_results,
};
