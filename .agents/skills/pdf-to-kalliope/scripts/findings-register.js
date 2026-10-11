#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { readJsonLines, writeJsonLines } from './audit-utils.js';

const statuses = new Set(['open', 'fixed', 'rejected', 'withdrawn', 'verified']);
const severities = new Set(['low', 'medium', 'high']);
const required = ['id', 'batch', 'reviewer', 'text_id', 'printed_page', 'facsimile', 'anchor', 'severity', 'description', 'status', 'snapshot'];

const validateFindings = rows => {
  const errors = [];
  const ids = new Set();
  rows.forEach((row, index) => {
    required.forEach(field => {
      if (row[field] == null || row[field] === '') errors.push(`linje ${index + 1}: mangler ${field}`);
    });
    if (ids.has(row.id)) errors.push(`linje ${index + 1}: duplikeret id ${row.id}`);
    ids.add(row.id);
    if (!statuses.has(row.status)) errors.push(`linje ${index + 1}: ukendt status ${row.status}`);
    if (!severities.has(row.severity)) errors.push(`linje ${index + 1}: ukendt severity ${row.severity}`);
    if (row.status !== 'open' && !row.disposition) errors.push(`linje ${index + 1}: ${row.id} mangler disposition`);
    if (row.status !== 'open' && !row.evidence) {
      errors.push(`linje ${index + 1}: ${row.id} mangler evidence`);
    }
    if (row.status === 'verified' && (row.verified_by == null || row.verified_by === '')) {
      errors.push(`linje ${index + 1}: ${row.id} mangler verified_by`);
    }
  });
  return errors;
};

const updateFinding = (rows, id, patch) => {
  const index = rows.findIndex(row => row.id === id);
  if (index === -1) throw new Error(`Ukendt finding-id: ${id}`);
  return rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch, id: row.id } : row);
};

const main = () => {
  const [command, filename, ...args] = process.argv.slice(2);
  if (!command || !filename) {
    console.error('Brug: node findings-register.js validate|status REGISTER.jsonl [ID STATUS DISPOSITION EVIDENCE SNAPSHOT VERIFIED-BY]');
    process.exitCode = 2;
    return;
  }
  try {
    const rows = readJsonLines(filename);
    if (command === 'validate') {
      const errors = validateFindings(rows);
      errors.forEach(error => console.error(error));
      const unresolved = rows.filter(row => row.status === 'open' || row.status === 'fixed');
      if (unresolved.length) console.error(`${unresolved.length} uverificerede finding(s).`);
      if (errors.length || unresolved.length) process.exitCode = 1;
      return;
    }
    if (command === 'status') {
      const [id, status, disposition, evidence, snapshot, verifiedBy] = args;
      const updated = updateFinding(rows, id, {
        status,
        disposition,
        evidence,
        snapshot,
        ...(verifiedBy == null ? {} : { verified_by: verifiedBy }),
      });
      const errors = validateFindings(updated);
      if (errors.length) throw new Error(errors.join('\n'));
      writeJsonLines(filename, updated);
      return;
    }
    throw new Error(`Ukendt kommando: ${command}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
};

if (fileURLToPath(import.meta.url) === process.argv[1]) main();

export { updateFinding, validateFindings };
