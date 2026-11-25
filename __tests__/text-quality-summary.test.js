import { formatSummary } from '../tools/check-text-quality.js';

it('reports warnings without a quality failure', () => {
  const issues = [{ rule: 'subtitle-slash', severity: 'warning' }];
  expect(formatSummary(issues)).toEqual({
    status: 'ok', summary: { qualityIssues: 0, warnings: 1 }, issues,
  });
});

it('keeps real errors blocking when warnings are also present', () => {
  const issues = [{ severity: 'warning' }, { severity: 'medium' }, { severity: 'high' }];
  expect(formatSummary(issues)).toEqual({
    status: 'quality-failure', summary: { qualityIssues: 2, warnings: 1 }, issues,
  });
});

it('keeps technical failures distinct from warnings', () => {
  expect(formatSummary([{ severity: 'warning' }], 'XML parse error').status).toBe('technical-error');
});
