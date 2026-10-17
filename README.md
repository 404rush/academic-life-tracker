# Academic Life Tracker

A week-by-week tracker for your degree, made for UG and PG students.

**Live site:** _[academic-life-tracker](https://404rush.github.io/academic-life-tracker/)_

You enter the day your program started and how long it runs, and it draws every week as a small square, a bit like the contribution graph on GitHub. Once a week is over, you score it from 1 to 5 and the square gets shaded to match. You can add a note or a few tags too, so future you remembers why a week was good or terrible.

I started it as a small UG tracker and it kept growing. It now handles semesters, trimesters and yearly programs, and it has a corner for placement season.

## What you can do

- Build the whole calendar from one start date (2 to 6 years, semester, trimester or annual layout)
- Edit semester dates and names, or add your own periods, like a study abroad term or an internship
- Score each week and attach a note and tags
- Log placement applications: company, round, date, and how it went
- Open the insights panel for streaks, term time vs break averages, and your best and worst weeks
- Export a backup file, a PNG of your grid, or a journal in Markdown
- Switch between light and dark mode

## About your data

Everything stays in your browser. There's no account and no server, so nothing you type gets sent anywhere. The only thing it loads from the internet is the fonts, from Google Fonts.

The catch is that your data lives in that one browser on that one device. If you clear your browser data it's gone, and what you fill in on your laptop won't appear on your phone. So hit **Export backup** every now and then, and use **Import backup** to restore it or move it somewhere else.

## Files

- `index.html` is the whole app in one file
- `manifest.json` and the two icons let you install it on your phone or desktop like an app
- `sw.js` is the service worker, which lets it work offline after the first load

Keep them in the same folder, since they find each other with relative paths.

## Putting it online

It's all static files, so GitHub Pages is enough.

1. Put the five files above in the root of a repo.
2. Go to Settings, then Pages, set the source to "Deploy from a branch", pick `main` and `/ (root)`, and save.
3. After a minute or so it's live at `https://yourusername.github.io/your-repo/`.

There's no build step and nothing to install.

## License

MIT. Use it, change it, share it, even sell it if you want to. All I ask is that you keep my name and the license notice with it. The full text is in `LICENSE`.

## Contact

I'm Arush Giri (Rush). 
If you find a bug or have an idea, email me at [rush.outward120@passinbox.com](mailto:rush.outward120@passinbox.com).

﹏𓊝﹏
