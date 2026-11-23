jest.mock('../tools/libs/caching.js', () => ({
  isFileModified: () => true,
}));
jest.mock('../tools/libs/helpers.js', () => ({
  fileExists: () => false,
  loadJSON: () => ({}),
  safeMkdir: () => {},
  writeJSON: jest.fn(),
}));
jest.mock('../tools/build-static/portraits.js', () => ({
  build_portraits_json: jest.fn(),
}));

import { writeJSON } from '../tools/libs/helpers.js';
import { build_portraits_json } from '../tools/build-static/portraits.js';
import { build_todays_events_json } from '../tools/build-static/today.js';

const poet = (id, country) => ({
  id,
  country,
  name: { lastname: id },
  has_portraits: true,
  period: { born: { date: '1763-12-28' } },
});

it('skips gallery-only images and selects another eligible birthday portrait', async () => {
  const family = { primary: false, src: 'family.jpg', content_html: [['Familie']] };
  const adult = { primary: true, src: 'adult.jpg', content_html: [['Portræt']] };
  build_portraits_json.mockImplementation(async person => person.id === 'gallery' ? [family] : [adult]);
  await build_todays_events_json({ poets: new Map([
    ['gallery', poet('gallery', 'dk')],
    ['representative', poet('representative', 'se')],
  ]) });
  const [, events] = writeJSON.mock.calls.find(([filename]) => filename === 'public/api/today/da/12-28.json');
  expect(events.filter(event => event.type === 'image')).toEqual([
    expect.objectContaining({ src: 'adult.jpg' }),
  ]);
});
