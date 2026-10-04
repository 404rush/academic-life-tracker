# Academic Life Tracker

A "life in weeks" tracker for UG and PG students - one square per week of your program, scored 1–5, colored like a GitHub contribution graph.

**Live site:** [_Academic Life Tracker_](https://404rush.github.io/academic-life-tracker/)

## What it does

- Builds a full-program calendar from a single start date — semester, trimester, or annual structure
- Score each week after it happens, with an optional note and tags
- Customize the calendar: override dates, rename periods, or carve in your own (study abroad, internship, anything) without breaking the rest
- Track placement season — company, stage, dates, all in one place
- See trends, streaks, and term-vs-break averages in Insights
- Export as a JSON backup, a shareable PNG, or a readable Markdown journal

## Your data

Everything lives in your browser's local storage. Nothing is uploaded anywhere — there's no backend, no account, no server this talks to. That also means it doesn't sync across devices or browsers on its own: use **Export backup** regularly, and **Import backup** to restore or move to another device.

## Files

| File | What it's for |
|---|---|
| `index.html` | The entire app. Open it directly or deploy it as-is. |
| `manifest.json` | Lets you "install" this as an app on your phone or desktop. |
| `sw.js` | Makes it work offline once it's been loaded once. |
| `icon-192.png` / `icon-512.png` | App icons used for install/home screen. |

All five need to sit in the same folder — the paths between them are relative.

## Deploying your own copy

1. Upload all 5 files into a repo's root folder (no subfolders).
2. Settings → Pages → Source → Deploy from a branch → `main` → `/ (root)` → Save.
3. Live at `https://yourusername.github.io/repo-name/` — `index.html` serves automatically at that root URL.

No build step, no dependencies, no `npm install`. It's one HTML file with everything — CSS, JS, the works — inlined.
