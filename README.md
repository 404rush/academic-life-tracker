# Academic Life Tracker

Your degree, one little square at a time.

This is a "life in weeks" tracker, GitHub-contribution-graph style - except instead of commits, it's just... you, every week, for however many years this lasts. Pick a start date, pick how your program's structured (semesters, trimesters, whatever your college calls it), and it lays out the whole calendar in front of you. Each week, once it's over, you give it an honest score from 1 to 5 and leave yourself a note if something happened worth remembering.

That's really the whole idea. No login, no app store, no "please verify your email." Open the page, start clicking squares.

**Live site:** _[academic-life-tracker](https://404rush.github.io/academic-life-tracker/)_

## A few things it also does

- Lets you customize almost anything — rename a semester, carve out your own period (hello, study abroad), fix a date that's wrong without breaking the rest of the year
- Has its own corner for placement season specifically, because that stretch deserves to be tracked on its own terms
- Shows you trends over time - streaks, term-vs-break averages, your best and worst weeks
- Exports what you've built as a backup file, a shareable image, or an actual readable journal

## Where your data goes

Nowhere, and that's not a dodge — there's genuinely no server behind this thing. Everything you type stays in your browser's local storage, on your device, full stop. Total privacy, but also: it won't magically show up on your other devices. So **export a backup now and then.** One click, and it's the only way to carry your data anywhere else — another browser, another phone, wherever.

## The files, briefly

| File | Does what |
|---|---|
| `index.html` | The whole app. The only file you actually *need*. |
| `manifest.json` | Lets your phone or desktop treat this like a real installed app. |
| `sw.js` | Quietly makes it work offline after the first load. |
| `icon-192.png`, `icon-512.png` | The little icons shown when you install it. |

Keep them all in the same folder — they reference each other with relative paths, so pulling one out on its own breaks things.

## Running your own copy

1. Drop all 5 files into a repo, root level, no subfolders.
2. Settings → Pages → Deploy from a branch → `main` → `/ (root)` → Save.
3. Give it a minute, then visit `https://yourusername.github.io/repo-name/`.

That's the entire deploy. No build step, no `npm install`, nothing to configure — it's one self-contained HTML file quietly doing all the work.

(The README, LICENSE and `.gitignore` are just along for the ride — the site itself only needs the five files above.)

## License

MIT — use it, change it, share it, build on it, free of charge. The one ask: keep the credit to the original author attached. Full text in [LICENSE](LICENSE).

## Made by

Arush Giri (Rush) — Integrated B.Sc. & M.Sc in Data Science.

If something's broken, confusing, or you just want to say hi: [rush.outward120@passinbox.com](mailto:rush.outward120@passinbox.com)

﹏𓊝﹏
