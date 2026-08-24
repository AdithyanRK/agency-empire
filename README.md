# Agency Empire

An idle-arcade recruitment agency tycoon, playable in the browser — built as a single self-contained HTML file with a hand-rolled canvas renderer.

**▶️ Play: https://adithyanrk.github.io/agency-empire/**

Best on a phone: open the link in your browser, then **Add to Home Screen** to play fullscreen like an app. Progress saves on your device.

## How it plays

You run the agency yourself: grab resumes from the job board, drop them at screening, walk screened candidates into the interview rooms and interview them, then introduce them to waiting clients and scoop up the fee. Hire staff to cover each leg — but they are slower than you and cost salaries every 45 seconds, so the tension is always doing it yourself versus paying someone to do it worse.

Three industries (Trades, IT staffing, Healthcare) and three offices (India, Dubai, USA) to expand into.

## Development

- `agency-empire.html` — the whole game. No build step, no dependencies beyond a Google Fonts link.
- `headless-test.js` — test harness: stubs DOM/canvas, runs ~60 assertions plus a 22-minute autoplay pacing bot and a stress suite.
- `DESIGN-HISTORY.md` — why the game is shaped the way it is, round by round.

```bash
python3 -c "import re; h=open('agency-empire.html').read(); open('game.js','w').write(re.search(r'<script>(.*?)</script>', h, re.S).group(1))"
python3 -c "t=open('headless-test.js').read(); g=open('game.js').read(); open('run_test.js','w').write(t.replace('/*GAME*/', g))"
node run_test.js   # expect ALL_TESTS_PASSED
```
