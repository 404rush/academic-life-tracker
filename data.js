// Academic Life Tracker — cleaning stored and imported data.  ﹏𓊝﹏ made by Arush Giri
//
// Everything that comes out of localStorage or an imported backup passes through here
// before the app uses it. A backup can come from anywhere, so a well-formed-looking file
// can still hold the wrong types (a string where an array should be, "5" instead of 5);
// these functions turn anything into the exact shape the app expects, so nothing
// downstream can crash on it. Pure functions, exposed on a single `TrackerData` object.
(function (root, Calendar) {
  'use strict';

  const { pd, addDays, weekAnchorKey, ALL_SLOTS } = Calendar;

  const PLACEMENT_STAGES = ['applied', 'oa', 'interview', 'offer', 'rejected'];

  function isPlainObject(x) { return !!x && typeof x === 'object' && !Array.isArray(x); }

  // Grows a per-year array to `len` entries but never shrinks it, so shortening the program
  // keeps the later years' settings in case it's lengthened again.
  function padArray(arr, len, makeBlank) {
    if (!Array.isArray(arr)) arr = [];
    return arr.length >= len ? arr : arr.concat(Array.from({ length: len - arr.length }, makeBlank));
  }

  // Score and note keys are dates ('YYYY-MM-DD'). `legacy` accepts the pre-v6 week numbers.
  function isEntryKey(k, legacy) { return legacy ? /^\d+$/.test(k) : !!pd(k); }

  // { key: 1–5 } — whole numbers only.
  function sanitizeScores(raw, legacy) {
    const out = {};
    if (!isPlainObject(raw)) return out;
    Object.keys(raw).forEach(k => {
      const v = Number(raw[k]);
      if (Number.isInteger(v) && v >= 1 && v <= 5 && isEntryKey(k, legacy)) out[k] = v;
    });
    return out;
  }

  // { key: { note: string, tags: string[] } } — entries with neither are dropped.
  function sanitizeNotes(raw, legacy) {
    const out = {};
    if (!isPlainObject(raw)) return out;
    Object.keys(raw).forEach(k => {
      const m = raw[k];
      if (!isPlainObject(m) || !isEntryKey(k, legacy)) return;
      const note = typeof m.note === 'string' ? m.note.slice(0, 500) : '';
      const tags = Array.isArray(m.tags)
        ? [...new Set(m.tags.filter(t => typeof t === 'string' && t.trim()).map(t => t.trim().slice(0, 24)))]
        : [];
      if (note || tags.length) out[k] = { note, tags };
    });
    return out;
  }

  // One object per year with only `<slot>_s` / `<slot>_e` date strings.
  function sanitizeOverrides(raw) {
    if (!Array.isArray(raw)) return null;
    return raw.map(yr => {
      const o = {};
      if (isPlainObject(yr)) {
        ALL_SLOTS.forEach(slot => ['_s', '_e'].forEach(suffix => {
          const k = slot + suffix;
          if (typeof yr[k] === 'string' && pd(yr[k])) o[k] = yr[k];
        }));
      }
      return o;
    });
  }

  // One array per year of { name, kind, start, end }.
  function sanitizeCustomPeriods(raw) {
    if (!Array.isArray(raw)) return null;
    return raw.map(list => !Array.isArray(list) ? [] : list
      .filter(isPlainObject)
      .map(c => ({
        name:  typeof c.name === 'string' ? c.name.slice(0, 30) : '',
        kind:  c.kind === 'break' ? 'break' : 'sem',
        start: typeof c.start === 'string' ? c.start : '',
        end:   typeof c.end === 'string' ? c.end : '',
      })));
  }

  // { slot: newName } for every calendar type's slots; '' means "keep the default name".
  function sanitizePeriodNames(raw) {
    const out = {};
    ALL_SLOTS.forEach(slot => { out[slot] = isPlainObject(raw) && typeof raw[slot] === 'string' ? raw[slot].slice(0, 24) : ''; });
    return out;
  }

  // [{ id, company, stage, date, note }] — entries without a company or a valid date are dropped.
  function sanitizePlacementEvents(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(isPlainObject)
      .map(ev => ({
        id:      typeof ev.id === 'string' && ev.id ? ev.id : `pl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        company: typeof ev.company === 'string' ? ev.company.slice(0, 40) : '',
        stage:   PLACEMENT_STAGES.includes(ev.stage) ? ev.stage : 'applied',
        date:    typeof ev.date === 'string' ? ev.date : '',
        note:    typeof ev.note === 'string' ? ev.note.slice(0, 80) : '',
      }))
      .filter(ev => ev.company && pd(ev.date));
  }

  // Converts pre-v6 data (keyed by week number) to date keys. Week N started N×7 days after
  // the first week, so this is exact as long as the calendar's start hasn't changed since.
  function migrateLegacyEntries(firstWeekStart, rawScores, rawNotes) {
    const keyFor = gi => weekAnchorKey(addDays(firstWeekStart, Number(gi) * 7));
    const scores = {}, notes = {};
    Object.entries(sanitizeScores(rawScores, true)).forEach(([gi, v]) => { scores[keyFor(gi)] = v; });
    Object.entries(sanitizeNotes(rawNotes, true)).forEach(([gi, m]) => { notes[keyFor(gi)] = m; });
    return { scores, notes };
  }

  const TrackerData = {
    padArray,
    sanitizeScores, sanitizeNotes, sanitizeOverrides, sanitizeCustomPeriods,
    sanitizePeriodNames, sanitizePlacementEvents, migrateLegacyEntries,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = TrackerData;
  else root.TrackerData = TrackerData;
})(typeof globalThis !== 'undefined' ? globalThis : this,
   typeof module !== 'undefined' && module.exports ? require('./calendar.js') : globalThis.Calendar);
