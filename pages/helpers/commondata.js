// All our images should have scaled versions with the following widths
module.exports.availableImageWidths = [
  100,
  150,
  200,
  250,
  300,
  400,
  500,
  600,
  800,
];

// Det er vigtigt at webp kommer før jpg, da Chrome vælger den første source
// den kender.
module.exports.availableImageFormats = ['webp', 'jpg'];

module.exports.fallbackImagePostfix = '-w800.jpg';
