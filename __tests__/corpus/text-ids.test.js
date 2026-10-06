import { execFileSync } from 'child_process';
import { loadTrackedWorkFiles } from '../../tools/libs/work-files.js';
import { parseWorkTextIds } from '../../tools/libs/text-id.js';
import {
  collectTextIdsAtRef,
  newTextIdErrors,
} from '../../tools/validate-new-text-ids.js';

describe('tracked work corpus text and section ids', () => {
  it('validates new ids against the shared poet, date, and sequence rule', () => {
    const baseRef = execFileSync('git', ['merge-base', 'origin/master', 'HEAD'], {
      encoding: 'utf8',
    }).trim();
    const baseTexts = collectTextIdsAtRef(baseRef);
    const headTexts = loadTrackedWorkFiles().flatMap(({ content, filename }) =>
      parseWorkTextIds(content, filename).texts,
    );

    expect(newTextIdErrors(baseTexts, headTexts)).toEqual([]);
  });
});
