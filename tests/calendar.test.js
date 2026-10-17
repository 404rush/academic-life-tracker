// ﹏𓊝﹏ Academic Life Tracker tests - Arush Giri
// Run from the project folder with:  node --test
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../calendar.js');

const D = s => C.pd(s);
const build = (start, opts = {}) => C.buildWeeks(D(start), opts.overrides || [], opts.years || 4,
  opts.custom || [], opts.names || {}, opts.preset || 'semester');

test('pd / ds round-trip and reject junk', () => {
  assert.equal(C.ds(D('2026-08-04')), '2026-08-04');
  assert.equal(C.pd(''), null);
  assert.equal(C.pd(42), null);
  assert.equal(C.pd('2026-08'), null);
});

test('weeks are consecutive 7-day steps from the start date', () => {
  const weeks = build('2026-08-05'); // a Wednesday
  assert.ok(weeks.length >= 4 * 52 - 1 && weeks.length <= 4 * 52 + 2);
  weeks.forEach((w, i) => {
    assert.equal(w.gi, i);
    assert.equal(C.daysBetween(weeks[0].weekStart, w.weekStart), i * 7);
    assert.equal(C.daysBetween(w.weekStart, w.weekEnd), 6);
  });
  assert.equal(weeks[0].weekStart.getDay(), 3, 'weeks start on the program\'s weekday, not Monday');
});

test('each calendar type produces its own periods in order', () => {
  const names = preset => [...new Set(build('2026-08-03', { preset, years: 1 }).map(w => w.periodName))];
  assert.deepEqual(names('semester'), ['Autumn Sem', 'Winter Break', 'Spring Sem', 'Summer Break']);
  assert.deepEqual(names('trimester'), ['Term 1', 'Break 1', 'Term 2', 'Break 2', 'Term 3', 'Summer Break']);
  assert.deepEqual(names('annual'), ['Academic Year', 'Summer Break']);
});

test('year 2 starts on the same calendar date as year 1', () => {
  const y2 = C.defaultPeriodsForYear(D('2026-08-03'), 1, 'semester')[0];
  assert.equal(C.ds(y2.start), '2027-08-03');
});

test('date overrides and renames apply for every calendar type', () => {
  for (const preset of C.PRESET_NAMES) {
    const first = C.PRESETS[preset][0].slot;
    const weeks = build('2026-08-03', {
      preset, years: 1,
      overrides: [{ [first + '_e']: '2026-08-30' }],
      names: { [first]: 'Renamed' },
    });
    const firstPeriodWeeks = weeks.filter(w => w.periodName === 'Renamed');
    assert.equal(firstPeriodWeeks.length, 4, `${preset}: first period cut to 4 weeks`);
  }
});

test('changing one end of a period moves the neighbouring automatic boundary too', () => {
  // Annual: Summer Break starts earlier → Academic Year ends the day before.
  let periods = C.resolvePeriods(D('2026-01-05'), [{ asum_s: '2026-09-01' }], 1, [], {}, 'annual');
  assert.equal(C.ds(periods[0].end), '2026-08-31');
  // Semester: Autumn ends earlier → Winter Break starts the day after.
  periods = C.resolvePeriods(D('2026-08-03'), [{ aut_e: '2026-11-20' }], 1, [], {}, 'semester');
  assert.equal(C.ds(periods[1].start), '2026-11-21');
  // Across years: Year 2 starts earlier → Year 1's summer ends the day before.
  periods = C.resolvePeriods(D('2026-08-03'), [{}, { aut_s: '2027-07-26' }], 2, [], {}, 'semester');
  assert.equal(C.ds(periods[3].end), '2027-07-25');
  // Both sides set by hand: left exactly as entered.
  periods = C.resolvePeriods(D('2026-08-03'), [{ aut_e: '2026-11-20', win_s: '2026-12-01' }], 1, [], {}, 'semester');
  assert.equal(C.ds(periods[0].end), '2026-11-20');
  assert.equal(C.ds(periods[1].start), '2026-12-01');
});

test('a custom period splits a semester and the week count carries on through it', () => {
  const weeks = build('2026-08-03', { years: 1, custom: [[{ name: 'Fest', kind: 'break', start: '2026-08-31', end: '2026-09-13' }]] });
  const seq = weeks.slice(0, 8).map(w => `${w.periodName}${w.weekInPeriod}`);
  assert.deepEqual(seq, ['Autumn Sem1', 'Autumn Sem2', 'Autumn Sem3', 'Autumn Sem4', 'Fest1', 'Fest2', 'Autumn Sem5', 'Autumn Sem6']);
});

test('a period with no week start day gets no weeks, and periodsWithoutWeeks reports it', () => {
  const custom = [[{ name: 'Midweek', kind: 'sem', start: '2026-08-12', end: '2026-08-14' }]]; // Wed–Fri, weeks start Mon
  const weeks = build('2026-08-03', { years: 1, custom });
  assert.ok(!weeks.some(w => w.periodName === 'Midweek'));
  const missing = C.periodsWithoutWeeks(weeks, custom);
  assert.equal(missing.length, 1);
  assert.equal(missing[0].name, 'Midweek');
});

test('a typo\'d year is caught by validation and capped by buildWeeks', () => {
  const overrides = [{ aut_e: '2926-12-01' }];
  assert.match(C.validateOverrides('2026-08-03', overrides, 1, [], {}, 'semester')[0], /typo/);
  assert.ok(build('2026-08-03', { years: 1, overrides }).length <= C.MAX_WEEKS_PER_PERIOD + 60);
});

test('validateCustomPeriods flags missing and reversed dates', () => {
  const p = C.validateCustomPeriods([[{ name: 'A', start: '2026-01-01', end: '' }, { name: 'B', start: '2026-02-01', end: '2026-01-01' }]]);
  assert.equal(p.length, 2);
});

test('a custom period typed into the wrong year is caught, and the right year named', () => {
  const custom = [
    [{ name: 'Internship', kind: 'sem', start: '2028-05-15', end: '2028-07-09' }], // Year 1 box, Year 2 dates
    [],
    [{ name: 'Exchange', kind: 'sem', start: '2028-09-01', end: '2028-12-01' }],   // Year 3 box, Year 3 dates: fine
    [{ name: 'Gap', kind: 'break', start: '2031-01-01', end: '2031-02-01' }],       // after the program ends
  ];
  const p = C.validateCustomPeriodYears('2026-08-03', [], 4, custom, {}, 'semester');
  assert.equal(p.length, 2);
  assert.match(p[0], /Year 1 "Internship".*in Year 2 — add it under Year 2/);
  assert.match(p[1], /Year 4 "Gap".*outside your program/);
  // A period that starts in its year and runs into the next one is allowed (e.g. a summer internship).
  assert.deepEqual(C.validateCustomPeriodYears('2026-08-03', [], 2,
    [[{ name: 'Internship', start: '2027-06-01', end: '2027-08-20' }]], {}, 'semester'), []);
});

test('giForDate finds the containing week, and -1 outside the calendar', () => {
  const weeks = build('2026-08-03', { years: 1 });
  assert.equal(C.giForDate(weeks, D('2026-08-03')), 0);
  assert.equal(C.giForDate(weeks, D('2026-08-09')), 0);
  assert.equal(C.giForDate(weeks, D('2026-08-10')), 1);
  assert.equal(C.giForDate(weeks, D('2026-08-02')), -1);
  assert.equal(C.giForDate(weeks, D('2030-01-01')), -1);
});

test('a week\'s storage key is its middle day, so it survives small start-date shifts', () => {
  const a = build('2026-08-03', { years: 1 });
  assert.equal(a[0].key, '2026-08-06');
  // Shift the start by 3 days either way: the old key still lands in the overlapping week.
  for (const shifted of ['2026-07-31', '2026-08-06']) {
    const b = build(shifted, { years: 1 });
    const gi = C.giForDate(b, D(a[5].key));
    assert.ok(Math.abs(C.daysBetween(a[5].weekStart, b[gi].weekStart)) <= 3, shifted);
  }
});

test('works across a daylight-saving change', () => {
  // Weeks are built from local dates; a 23- or 25-hour day must not drop or duplicate a week.
  const weeks = build('2026-03-02', { years: 1 });
  for (let i = 1; i < weeks.length; i++) assert.equal(C.daysBetween(weeks[i - 1].weekStart, weeks[i].weekStart), 7);
});
