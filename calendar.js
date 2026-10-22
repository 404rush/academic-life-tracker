// Academic Life Tracker - calendar logic.  ﹏𓊝﹏ made by Arush Giri
//
// Pure functions only: no DOM, no localStorage. index.html loads this as a plain <script>
// (so the app still works when opened straight from disk), and the tests load it in Node.
// Everything is exposed on a single `Calendar` object.
(function (root) {
  'use strict';

  // No real term or break is anywhere near this long. Caps a typo'd year (2923 for 2023)
  // so it can't generate thousands of weeks and freeze the tab.
  const MAX_WEEKS_PER_PERIOD = 130;

  // Dates
  // All dates are local midnight. Strings are always 'YYYY-MM-DD'.

  function pd(s) {
    if (typeof s !== 'string' || s.length < 10) return null;
    const [y, m, d] = s.split('-').map(Number);
    return (y && m && d) ? new Date(y, m - 1, d) : null;
  }

  function ds(d) {
    if (!d) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

  // Whole days from a to b, rounded so DST's 23/25-hour days don't throw it off.
  function daysBetween(a, b) { return Math.round((b - a) / 86400000); }

  // Calendar layouts
  // One year of each calendar type, as week offsets from that year's start date.
  // `slot` is a stable id for the period, used as the key for its date overrides
  // (`<slot>_s`, `<slot>_e`) and its rename. The semester slots keep their original
  // names so data saved by older versions still applies.
  const PRESETS = {
    semester: [
      { slot: 'aut',  name: 'Autumn Sem',    kind: 'sem',   from: 0,  to: 18 },
      { slot: 'win',  name: 'Winter Break',  kind: 'break', from: 18, to: 22 },
      { slot: 'spr',  name: 'Spring Sem',    kind: 'sem',   from: 22, to: 39 },
      { slot: 'sum',  name: 'Summer Break',  kind: 'break', from: 39, to: 52 },
    ],
    trimester: [
      { slot: 't1',   name: 'Term 1',        kind: 'sem',   from: 0,  to: 12 },
      { slot: 'tb1',  name: 'Break 1',       kind: 'break', from: 12, to: 14 },
      { slot: 't2',   name: 'Term 2',        kind: 'sem',   from: 14, to: 26 },
      { slot: 'tb2',  name: 'Break 2',       kind: 'break', from: 26, to: 28 },
      { slot: 't3',   name: 'Term 3',        kind: 'sem',   from: 28, to: 40 },
      { slot: 'tsum', name: 'Summer Break',  kind: 'break', from: 40, to: 52 },
    ],
    annual: [
      { slot: 'yr',   name: 'Academic Year', kind: 'sem',   from: 0,  to: 40 },
      { slot: 'asum', name: 'Summer Break',  kind: 'break', from: 40, to: 52 },
    ],
  };
  const PRESET_NAMES = Object.keys(PRESETS);
  const ALL_SLOTS = PRESET_NAMES.flatMap(p => PRESETS[p].map(x => x.slot));

  function presetLayout(preset) { return PRESETS[preset] || PRESETS.semester; }

  // Default periods for year `yi`. Each year starts on the same calendar date as the
  // program did, so an August start stays an August start every year.
  function defaultPeriodsForYear(programStart, yi, preset) {
    const anchor = new Date(programStart.getFullYear() + yi, programStart.getMonth(), programStart.getDate());
    return presetLayout(preset).map(p => ({
      slot: p.slot, name: p.name, kind: p.kind,
      start: addDays(anchor, p.from * 7),
      end:   addDays(anchor, p.to * 7 - 1), // the day before the next period starts
    }));
  }

  // - Building the timeline ---------

  // Cuts custom periods into a list of base periods. Wherever a custom period overlaps a
  // base period, the base period is trimmed, split around it, or dropped, and the custom
  // period takes that space. Everything outside its dates is left alone.
  function applyCustomPeriods(basePeriods, customPeriods) {
    let result = basePeriods.slice();
    customPeriods.forEach(custom => {
      if (!custom.start || !custom.end || custom.end < custom.start) return;
      const next = [];
      result.forEach(base => {
        if (custom.end < base.start || custom.start > base.end) { next.push(base); return; }
        if (base.start < custom.start) next.push({ ...base, end: addDays(custom.start, -1) });
        if (base.end > custom.end)     next.push({ ...base, start: addDays(custom.end, 1) });
      });
      next.push({
        name: custom.name || 'Custom',
        kind: custom.kind === 'break' ? 'break' : 'sem',
        start: custom.start, end: custom.end,
      });
      result = next.filter(p => p.start <= p.end).sort((a, b) => a.start - b.start);
    });
    return result;
  }

  // Every period of the program with its effective dates and name: the override or rename
  // where one is set, the default otherwise, with custom periods cut in. buildWeeks and
  // validateOverrides both use this, so they always agree on what the settings mean.
  //   overrides:   one object per year, e.g. { aut_s: '2026-08-03', spr_e: '2027-05-01' }
  //   customByYear: one array per year of { name, kind, start, end } (date strings)
  //   names:       renames by slot, e.g. { aut: 'Odd Sem' }
  function resolvePeriods(programStart, overrides, numYears, customByYear, names, preset) {
    const start = new Date(programStart);
    const renames = names || {};
    const years = numYears || 4;

    // Base periods for every year, in order, noting which dates the user set.
    const base = [];
    for (let yi = 0; yi < years; yi++) {
      const ov = (overrides && overrides[yi]) || {};
      defaultPeriodsForYear(start, yi, preset).forEach(def => {
        const s = pd(ov[def.slot + '_s']), e = pd(ov[def.slot + '_e']);
        base.push({
          yi,
          name:  (typeof renames[def.slot] === 'string' && renames[def.slot].trim()) || def.name,
          kind:  def.kind,
          start: s || def.start, startSet: !!s,
          end:   e || def.end,   endSet: !!e,
        });
      });
    }

    // Moving one end of a period moves its neighbour's automatic boundary with it, so
    // e.g. starting Summer Break earlier also ends the term before it earlier. Only when
    // both sides of a boundary are set by hand can they overlap or leave a gap.
    for (let i = 1; i < base.length; i++) {
      const prev = base[i - 1], cur = base[i];
      if (cur.startSet && !prev.endSet) prev.end = addDays(cur.start, -1);
      else if (prev.endSet && !cur.startSet) cur.start = addDays(prev.end, 1);
    }

    const resolved = [];
    for (let yi = 0; yi < years; yi++) {
      let periods = base.filter(p => p.yi === yi);

      const custom = (customByYear && Array.isArray(customByYear[yi]) ? customByYear[yi] : [])
        .filter(c => c && typeof c === 'object');
      if (custom.length) {
        periods = applyCustomPeriods(periods, custom.map(c => ({
          name: typeof c.name === 'string' ? c.name : 'Custom',
          kind: c.kind, start: pd(c.start), end: pd(c.end),
        })));
      }

      periods.forEach(p => resolved.push({ yi, name: p.name, kind: p.kind, start: p.start, end: p.end }));
    }
    return resolved;
  }

  // The key a week's score and note are stored under: its middle day. Entries are matched
  // to whichever week contains their date, so after a small start-date shift each entry
  // follows the new week that overlaps its old week the most.
  function weekAnchorKey(weekStart) { return ds(addDays(weekStart, 3)); }

  // The program as a list of consecutive 7-day weeks. One cursor walks the whole timeline
  // in 7-day steps, and each week belongs to the period its first day falls in - so weeks
  // never overlap, even when custom periods or overrides leave no gap between periods.
  // A week can't start on any weekday but the program's first day, which is why a period
  // that contains no week's first day (e.g. a Wed–Fri fest) gets no weeks at all.
  function buildWeeks(programStart, overrides, numYears, customByYear, names, preset) {
    const periods = resolvePeriods(programStart, overrides, numYears, customByYear, names, preset);
    if (!periods.length) return [];

    const sorted = periods.slice().sort((a, b) => a.start - b.start);
    const overallEnd = sorted[sorted.length - 1].end;
    const weeks = [];
    let cursor = new Date(sorted[0].start);
    let periodIdx = 0;
    let weeksInSegment = 0; // for the MAX_WEEKS_PER_PERIOD cap

    // "Week N of Autumn Sem" keeps counting across a custom period that splits it in two.
    const weekCounters = new Map(); // `${year}-${name}` → weeks so far

    while (cursor <= overallEnd) {
      while (periodIdx < sorted.length - 1 &&
             (cursor > sorted[periodIdx].end || weeksInSegment >= MAX_WEEKS_PER_PERIOD)) {
        periodIdx++;
        weeksInSegment = 0;
      }
      if (weeksInSegment >= MAX_WEEKS_PER_PERIOD) break;

      const period = sorted[periodIdx];
      const counterKey = `${period.yi}-${period.name}`;
      const weekInPeriod = (weekCounters.get(counterKey) || 0) + 1;
      weekCounters.set(counterKey, weekInPeriod);

      weeks.push({
        gi: weeks.length,
        weekStart: new Date(cursor),
        weekEnd: addDays(cursor, 6),
        key: weekAnchorKey(cursor),
        kind: period.kind,
        periodName: period.name,
        year: period.yi + 1,
        weekInPeriod,
      });
      weeksInSegment++;
      cursor = addDays(cursor, 7);
    }
    return weeks;
  }

  // Index of the week containing date d, or -1. Weeks are consecutive, so this is arithmetic.
  function giForDate(weeks, d) {
    if (!weeks.length || !d) return -1;
    const days = daysBetween(weeks[0].weekStart, d);
    if (days < 0) return -1;
    const gi = Math.floor(days / 7);
    return gi < weeks.length ? gi : -1;
  }

  // - Validation --------------─
  // Each returns a list of human-readable problems; empty means fine.

  const MAX_PERIOD_DAYS = 400;

  function validateCustomPeriods(customByYear) {
    const problems = [];
    customByYear.forEach((list, yi) => list.forEach(c => {
      const label = c.name || 'custom period';
      const s = pd(c.start), e = pd(c.end);
      if (!s || !e) {
        problems.push(`Year ${yi + 1} "${label}": needs both a start and end date.`);
      } else if (e < s) {
        problems.push(`Year ${yi + 1} "${label}": end date is before the start date.`);
      } else if (daysBetween(s, e) > MAX_PERIOD_DAYS) {
        problems.push(`Year ${yi + 1} "${label}": spans ~${Math.round(daysBetween(s, e) / 7)} weeks — check the dates.`);
      }
    }));
    return problems;
  }

  // Checks the resolved periods, not the raw fields: a lone overridden end date paired with
  // the default start is exactly how a typo'd year turns into a century-long semester.
  function validateOverrides(programStartStr, overrides, numYears, customByYear, names, preset) {
    const s = pd(programStartStr);
    if (!s) return [];
    const problems = [];
    resolvePeriods(s, overrides, numYears, customByYear, names, preset).forEach(p => {
      if (!p.start || !p.end) return;
      if (p.end < p.start) {
        problems.push(`Year ${p.yi + 1} ${p.name}: end date is before the start date.`);
      } else if (daysBetween(p.start, p.end) > MAX_PERIOD_DAYS) {
        problems.push(`Year ${p.yi + 1} ${p.name}: spans ~${Math.round(daysBetween(p.start, p.end) / 7)} weeks — check the year, that's probably a typo.`);
      }
    });
    return problems;
  }

  // A custom period belongs to the year it was entered under, so it has to start inside that
  // year. One typed into the wrong year's box would otherwise get no weeks at all (the year it
  // actually falls in already covers those dates), so name the right year instead.
  function validateCustomPeriodYears(programStartStr, overrides, numYears, customByYear, names, preset) {
    const s = pd(programStartStr);
    if (!s) return [];
    const years = numYears || 4;
    const base = resolvePeriods(s, overrides, years, [], names, preset);
    const ranges = Array.from({ length: years }, (_, yi) => {
      const ps = base.filter(p => p.yi === yi);
      return { start: ps[0].start, end: ps[ps.length - 1].end };
    });
    const fmtDate = d => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const problems = [];
    customByYear.forEach((list, yi) => {
      if (yi >= years) return;
      list.forEach(c => {
        const cs = pd(c.start), ce = pd(c.end);
        if (!cs || !ce) return; // reported by validateCustomPeriods
        const r = ranges[yi];
        if (cs >= r.start && cs <= r.end) return;
        const label = `Year ${yi + 1} "${c.name || 'custom period'}"`;
        const home = ranges.findIndex(x => cs >= x.start && cs <= x.end);
        problems.push(home >= 0
          ? `${label} starts on ${fmtDate(cs)}, which is in Year ${home + 1} — add it under Year ${home + 1} instead.`
          : `${label} starts on ${fmtDate(cs)}, outside your program (${fmtDate(ranges[0].start)} to ${fmtDate(ranges[years - 1].end)}).`);
      });
    });
    return problems;
  }

  // Custom periods that end up with no weeks (see buildWeeks). Returns [{ yi, name, start, end }].
  function periodsWithoutWeeks(weeks, customByYear) {
    const missing = [];
    customByYear.forEach((list, yi) => list.forEach(c => {
      const cs = pd(c.start), ce = pd(c.end), name = c.name || 'Custom';
      if (!cs || !ce) return;
      const shows = weeks.some(w => w.year === yi + 1 && w.periodName === name && w.weekStart >= cs && w.weekStart <= ce);
      if (!shows) missing.push({ yi, name, start: cs, end: ce });
    }));
    return missing;
  }

  const Calendar = {
    MAX_WEEKS_PER_PERIOD, PRESETS, PRESET_NAMES, ALL_SLOTS,
    pd, ds, addDays, daysBetween,
    presetLayout, defaultPeriodsForYear, resolvePeriods,
    weekAnchorKey, buildWeeks, giForDate,
    validateCustomPeriods, validateCustomPeriodYears, validateOverrides, periodsWithoutWeeks,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Calendar;
  else root.Calendar = Calendar;
})(typeof globalThis !== 'undefined' ? globalThis : this);
