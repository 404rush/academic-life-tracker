// ﹏𓊝﹏ Academic Life Tracker tests — Arush Giri
// Run from the project folder with:  node --test
const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../data.js');
const C = require('../calendar.js');

test('scores: keeps whole numbers 1–5 under date keys, converts "5", drops the rest', () => {
  // JSON.parse, like a real backup file: it makes "__proto__" an ordinary key, which must be dropped.
  const out = T.sanitizeScores(JSON.parse('{"2026-01-08":"5","2026-01-15":99,"2026-01-22":2.5,"2026-01-29":3,"junk":4,"__proto__":3}'));
  assert.deepEqual(out, { '2026-01-08': 5, '2026-01-29': 3 });
  assert.equal(Object.getPrototypeOf(out), Object.prototype, 'prototype untouched');
  assert.deepEqual(T.sanitizeScores('nope'), {});
  assert.deepEqual(T.sanitizeScores([1, 2]), {});
});

test('notes: string tags (which used to crash the grid) become an empty list', () => {
  const out = T.sanitizeNotes({
    '2026-01-08': { note: 'hi', tags: 'exam' },
    '2026-01-15': { note: 7, tags: ['a', 5, ' a ', ''] },
    '2026-01-22': { note: '', tags: [] },
    '2026-01-29': 'x',
  });
  assert.deepEqual(out, { '2026-01-08': { note: 'hi', tags: [] }, '2026-01-15': { note: '', tags: ['a'] } });
});

test('overrides: null and non-object years become {}, only valid slot dates survive', () => {
  const out = T.sanitizeOverrides([null, 'x', { aut_s: '2026-08-03', t1_e: '2026-10-01', aut_e: 'soon', evil: '2026-01-01' }]);
  assert.deepEqual(out, [{}, {}, { aut_s: '2026-08-03', t1_e: '2026-10-01' }]);
  assert.equal(T.sanitizeOverrides('x'), null);
});

test('custom periods and period names are normalised', () => {
  assert.deepEqual(T.sanitizeCustomPeriods([[{ name: 5, kind: 'x', start: '2026-01-01' }], 'oops']),
    [[{ name: '', kind: 'sem', start: '2026-01-01', end: '' }], []]);
  const names = T.sanitizePeriodNames({ aut: 'Odd Sem', t1: 7 });
  assert.equal(names.aut, 'Odd Sem');
  assert.equal(names.t1, '');
  assert.deepEqual(Object.keys(names).sort(), [...C.ALL_SLOTS].sort());
});

test('placements without a company or date are dropped; bad stages become "applied"', () => {
  const out = T.sanitizePlacementEvents([
    { id: 'a', company: 'Acme', stage: 'hired', date: '2026-02-01' },
    { company: '', date: '2026-02-01' },
    { company: 'NoDate' },
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].stage, 'applied');
});

test('padArray grows but never shrinks', () => {
  assert.equal(T.padArray([{}, {}], 4, () => ({})).length, 4);
  assert.equal(T.padArray([1, 2, 3, 4, 5], 2, () => 0).length, 5);
  assert.equal(T.padArray(null, 3, () => 0).length, 3);
});

test('legacy week-number data converts to the matching week\'s date key', () => {
  const first = C.pd('2026-01-05');
  const { scores, notes } = T.migrateLegacyEntries(first, { 0: 5, 3: '1', x: 4 }, { 3: { note: 'sick', tags: ['sick'] } });
  assert.deepEqual(scores, { '2026-01-08': 5, '2026-01-29': 1 });
  assert.deepEqual(notes, { '2026-01-29': { note: 'sick', tags: ['sick'] } });
});
