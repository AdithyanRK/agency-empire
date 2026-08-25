# Agency Empire — design history and handoff

A recruitment agency management game in the idle-arcade style (the Pizza Ready / Supercent formula), built as a single-file HTML5 canvas prototype. This document exists so whoever picks the project up next understands **why** the game is shaped the way it is, not just what the code does. Most of the decisions below were reversals, and the reasoning behind a reversal is worth more than the final value.

Prototype status: playable, feature-complete for a feel test, not production ready. See "Where to take it next" at the end.

---

## 1. What the game is

You run a recruitment agency. You personally do the work: fetch resumes from the job board, carry them to the screening desk, walk screened candidates to the interview rooms, interview them yourself, then walk interviewed candidates to waiting clients and scoop up the fee. You hire staff to cover each leg, but staff are slower than you and cost salaries every month, so the tension is always between doing it yourself and paying someone to do it worse.

Three verticals, all in one office, distinguished by colour:

| Vertical | Colour | Base fee |
|---|---|---|
| Blue collar | `#E8923A` orange | $17 |
| IT staffing | `#4A90D9` blue | $40 |
| Healthcare | `#2FA98C` teal | $82 |

Three offices, unlocked in order, each keeping its own upgrades, staff and stats:

| Country | Fee multiplier | Passive/min when away | Cost to unlock |
|---|---|---|---|
| India | 1x | $2 | start |
| Dubai | 2.4x | $9 | $3,600 |
| USA | 6x | $26 | $40,000 |

---

## 2. The pipeline

```
Job board  →  Screening desk  →  Waiting area  →  Interview rooms  →  Ready bench  →  Client lobby  →  Cash on the floor
 (resumes)      (18% rejected)     (12 slots)      (6 rooms)          (6 slots)       (4 clients)
```

Every stage has a capacity, and **capacity is backpressure**: when the waiting area fills, screening stops; when the ready bench fills, finished interviews hold candidates inside the rooms. Both show live counts (`Screened 7/12 · screening paused`). This is deliberate — in this genre the jam *is* the tutorial. The player should never need to read text to know where the bottleneck is.

### Roles

| Role | Cost | Max | Salary/mo | Job |
|---|---|---|---|---|
| Sourcer | $180 | 4 | $34 | Carries resumes from job board to screening |
| Recruiter | $120 | 4 | $46 | Stations in one interview room and interviews |
| Account manager | $400 | 4 | $58 | Claims a client's whole order, fetches the crew, introduces them |
| Finance exec | $320 | 1 | $40 | Collects cash off the floor and banks it |

**Interview speed is the core lever.** A room staffed by a Recruiter runs at 1.0x. A room where the *player* is standing runs at **2.2x**. An unattended room crawls at **0.2x**. Since rooms go to six and Recruiters cap at four, there is always at least one room only the player can run properly.

---

## 3. Iteration history

Each entry is a thing that was built, then changed, and why. The reversals are the valuable part.

### Round 1 — Genre selection
Started as a deep management tycoon (payroll, accounts receivable, staff morale, market cycles, declining clients). Redirected to the Pizza Ready idle-arcade formula after studying it: top-down character, proximity interactions, stack-and-carry, physical cash, visible bottlenecks, hire-to-automate.

**Cut at this point:** payroll, AR, morale, market cycles. Rationale: the idle-arcade formula never punishes the player, and that is a large part of why those games reach fifty million downloads. (Payroll came back in Round 11 — see below. The reasoning that killed it was correct for the genre and wrong for this specific product's goals.)

### Round 2 — One office, countries as expansion
Original plan had a separate office per vertical. Changed to **all verticals in one office**, with new offices reserved for countries. This is a better fit for the theme: an agency doesn't open a new building to add a service line, it opens one to enter a new market.

### Round 3 — The supply/demand deadlock
The office overproduced blue-collar candidates while only IT clients arrived, jamming every buffer with the wrong colour. Three fixes: the job board prints weighted toward waiting client demand, new clients arrive weighted toward existing pipeline supply, and candidates with no matching client eventually walk out to free the slot.

### Round 4 — Upgrades that did nothing
Base supply outran base demand from minute one, so the counter was always stocked and no upgrade changed anything the player could feel. Rebuilt the rates so **demand slightly exceeds supply at level zero**. Added Marketing as a category so demand itself becomes purchasable, creating the loop: buy marketing → clients outpace ops → buy software and staff → supply outruns demand → buy marketing again. The bottleneck ping-pongs, and choosing which side to feed is the decision.

### Round 5 — Roles that didn't do their jobs
Recruiters and account managers walked around leading candidates in trains, which looked identical to what the player does and matched nobody's mental model of the roles. Rebuilt:
- **Recruiters station inside interview rooms** and never walk. A speech-bubble conversation animates during the interview.
- **Account managers stand at the lobby**, claim a client's entire order, fetch the whole crew in one trip and introduce them.

### Round 6 — Marketing as staff made no sense
Marketers stood around doing nothing legible, and the campaign banner read "WE ARE HIRING", which is candidate-facing copy for a business that sells to employers. Deleted the role entirely. Replaced the automatic "hiring blitz" event with a **player-triggered Promotion**: stand on the stand, pay a scaling fee, and for 30 seconds clients flood in at ~3x rate with fees at 1.5x, then a 45-second cooldown.

### Round 7 — Decorations, added and removed
Added five functional decorations (coffee machine, break room, aquarium, trophy shelf, gallery wall) as a late-game cash sink. Removed them one round later: they were five things to buy that didn't change how you play, and the break room in particular was a passive stat bonus with a rug drawn under it, which is why nobody could see staff "using" it.

### Round 8 — The counter was vestigial
Once candidates had a "ready to place" bench, the placement counter and its candidate pool were a parking lot between two useful stages. Deleted both, plus automatic matching. **Fees now spawn as cash at the client's feet** where the placement happened, so money appears where the work happened and the player has to go get it.

### Round 9 — The player became an audience
The most important reversal. Stationing the staff automated the player out of their own game: with a full team, the correct play was to stand still and watch. Two attempts:

1. **Failed attempt:** a +50% "personal introduction" bonus for delivering candidates yourself. Rejected in playtest — a percentage bonus doesn't create the *feeling* of being needed.
2. **What worked:** make the player an interviewer. Rooms do nothing meaningful without a person in them, and the player is the fastest interviewer in the building. The player is now structurally required rather than financially incentivised.

**Important engineering note:** the first version of this set unattended rooms to **zero** progress, which is what "the player must interview" literally implies. The autoplay bot then spiralled in a third of runs — earnings collapsed from ~32k to ~1,800 — because falling behind on interviewers hard-stopped the entire pipeline with no recovery path. The 0.2x trickle exists specifically to prevent that death spiral. **Do not set it to zero.**

### Round 10 — Streak removed
A "chain" multiplier rewarded back-to-back placements and reset when a client walked out. Removed along with its HUD widget: the label read "Chain x1.8" with no explanation of what it meant, and a bonus the player can't understand is worse than no bonus.

### Round 11 — Payroll returns, and the game becomes a business sim
A one-hour session earned $1,627k, which is not a game, it's a screensaver with numbers. Reversed the Round 1 decision deliberately:

- **Staff quitting removed** (it was random punishment) and **payroll added** (it is a standing commitment the player chose).
- Salaries due every **45 seconds**. Short at payday and the bank covers it automatically as debt with a 15% penalty. Exhaust the credit line and it's game over with a restart of that office.
- **Loans** at the Manager desk: two sizes, 12% interest per month, against a credit line that scales with placement count.
- Income cut across every lever: fees down ~20%, Employer brand from +20% to +15% per level with one fewer level, country multipliers from 3x/10x down to 2.4x/6x, passive income roughly halved.

Measured result: gross rate fell from 1,627k/hour to about **47k/hour**, a 34x reduction. The bot survived 28 paydays and finished a 22-minute run with a net worth of $356 against $269 of debt.

This is a genuine departure from the Supercent formula, which never punishes. It was the right call for this product because the goal is a game about running an agency, not a maximally-retentive idle game. **It is also the single biggest retention risk in the build and the first thing a CPI test should measure.**

---

## 4. Design principles worth preserving

1. **The bottleneck must be visible on the floor.** Never explain a jam in text when a queue can show it.
2. **The player is the fastest worker in the building.** Every automation should be a slower substitute for the player, never a superior one.
3. **Nothing hard-stops.** Every automated leg has a slow fallback (candidates drift to rooms after 9s; ready candidates self-deliver after 5s; unattended rooms run at 0.2x). Idle play must trickle, or a bad start becomes unrecoverable.
4. **Colour means exactly one thing.** Orange, blue and teal mean vertical, only ever on candidates. Staff wear one charcoal uniform with a role letter. Clients wear near-black.
5. **No jargon in the UI.** If a number needs explaining, either explain it inline or cut it.
6. **Decisions over decorations.** Anything purchasable must change how the player plays.

---

## 5. Known limitations and open bugs

- **No screenshot verification.** The build environment had no browser, so all geometry was verified by coordinate arithmetic and headless simulation, never by eye. Layout positions should be visually audited first thing.
- **Colour-mismatch remains partially unsolved.** With a long pipeline, a candidate's vertical is decided ~30s before they reach a client. Mitigated three ways (retag at interview exit based on live demand, off-spec placements at 55% fee once a client's patience drops below 55%, retag on the bench) but the measured "starved client" rate still sits around 40-60% in bot runs. It no longer costs the player clients, but it is not elegant.
- **The autoplay bot is a poor player.** All balance numbers come from a scripted bot that cannot judge timing, so treat them as a floor, not a target. A human should substantially outperform them.
- **High run-to-run variance.** Balance figures swing meaningfully between seeds. Any retuning should average several runs, not trust one.
- **Save format has no version field.** `agency_empire_v1` is loaded with per-field clamping, but there is no migration framework. Add one before shipping updates.
- **Audio is synthesised WebAudio beeps.** Placeholder quality.
- **No analytics, no ads, no IAP.** None of the monetisation layer exists.

---

## 6. Where to take it next

### The honest recommendation on tech
This prototype is a single 1,700-line HTML file with a hand-rolled canvas renderer. It exists to answer one question: does the loop feel good? It should not be the production codebase.

**This genre lives in Unity.** Chibi 3D characters, navmesh pathing, stack-and-carry animation, and — critically — the ad mediation SDKs that fund the entire category are trivial in Unity and painful anywhere else. Every studio shipping in this space builds there. The realistic path is to contract one Unity developer, use the prototype as the design spec, and let asset store packs cover most of the art.

If staying in TypeScript is a hard requirement, the port is React Three Fiber wrapped in Capacitor, and you should budget custom work for navigation, animation and ad mediation.

### If refactoring this codebase anyway
Split the single file into modules: `state.js` (the state object, save/load, migrations), `economy.js` (all the pure cost and rate functions — they're already pure, which makes them trivially testable), `entities.js` (candidate, client and staff state machines), `render.js`, `ui.js`. The headless test harness (`headless-test.js`) already stubs the DOM and canvas and should port with minimal changes — keep it, it caught roughly a dozen real bugs including double-payments, orphaned followers, unbounded candidate accumulation and a reclaim/drop infinite loop.

### Validation before any of that
The genre's own playbook: build to a testable state, spend **$500–1,000 on install ads**, and read two numbers — cost per install, and D1 retention. Genre hits sit around 40%+ D1. Under 25% and the loop isn't working. This costs under a thousand dollars and two weeks, and it should happen before anyone writes Unity code.

The specific thing to measure: **does payroll help or hurt D1?** It's the one mechanic that departs from the formula that makes these games work.

---

## 7. Files

| File | What it is |
|---|---|
| `agency-empire.html` | The complete game. Single file, no build step, no dependencies beyond a Google Fonts link. Open it in a browser. |
| `headless-test.js` | Test harness. Stubs DOM, canvas and `performance.now()`, injects the game via a `/*GAME*/` placeholder, then runs ~57 assertions plus a 22-minute autoplay pacing bot and a stress suite (rapid country hops, corrupted saves, slot-collision checks, maxed-out soak). |

To run the tests:

```bash
# extract the game script from the HTML
python3 -c "import re; h=open('agency-empire.html').read(); open('game.js','w').write(re.search(r'<script>(.*?)</script>', h, re.S).group(1))"
# inject it into the harness and run
python3 -c "t=open('headless-test.js').read(); g=open('game.js').read(); open('run_test.js','w').write(t.replace('/*GAME*/', g))"
node run_test.js
```

Expect `ALL_TESTS_PASSED`. Run it several times — some assertions are probabilistic.

---

## Round 12 — Optimization pass (2026-08-24)

Post-handoff round driven by four owner directives plus a measured audit (two code audits + six instrumented bot runs). All numbers verified by the harness before/after.

**Owner directives, all shipped:**
1. **Recruiters fetch.** Recruiters were literally AI-free (walk to post, stop forever; the interview was a positional rule on the candidate). Now a `toRoom → work → fetch → lead` machine: an idle recruiter with an empty room claims a waiting candidate and walks them in. Room speed is keyed on actual recruiter *presence* (`roomRec[]`), so a fetching recruiter's room visibly drops to the 0.2x trickle — the bottleneck stays on the floor. Fetches never interrupt a running interview.
2. **Blue-collar recolor.** "Blue collar" → **Trades**, terracotta `#B15B3E`. Orange had eleven competing uses; now the tutorial arrow is paper/ink, board pips gold, confetti gold, progress bars are always green (the interview bar was literally IT's hex), and un-interviewed candidates render at 0.85 alpha instead of 0.55 so their colour is readable when it matters.
3. **Loans removed.** Borrow/repay UI, emergency loans and amortization deleted (measured: end-of-run debt was ~$0 in every bot run — the system was a safety net, not a decision). Old saves migrate (`debt` deleted, save gains `v:1`).
4. **Payroll gated at $1,000 banked** (×country multiplier), then permanent. Measured before: first payday at minute ~1 against first-$1k at minute ~12 — the gate removes ~15 of the first 19 paydays. **New failure rule: the balance can go negative; game over only at −$10k ×mul.** Restart cash now scales by country.

**Also fixed (audit findings):**
- Player lock-out: 3 recruiters + unupgraded rooms used to leave the player no room (the exact Round-9 failure). The last room is now always the player's; recruiter hires cap at rooms−1.
- Mobile was unplayable: in-world text rendered at 5–8 CSS px (now UI_SCALEd to ≥12), no touch movement hint (now toast + pulsing drag-ghost), letterboxed off-center (now flex-centered + safe-area insets).
- Saving was a no-op in a plain browser (`window.storage` undefined) — now falls back to localStorage.
- First-dollar was probabilistic 15–34s: fresh runs pre-fill 3 resumes, print instantly, and all clients need exactly 1 hire until the first placement lands.
- Shredder/job-board radius overlap silently destroyed pickups; bench level 3 granted zero slots; tutorial arrows pointed ~55px off the hotspots.
- Balance: Dubai $3.6k→$2.4k, USA $40k→$25k (Dubai was unreachable in any 22-min run); patience 34→24 (walkouts were literally impossible — now 2–6% loss rate, so the Lounge upgrade and off-spec path exist); screening speed moved from recruiter-count (a hidden 2.9× coupling) to sourcers; promo overflow spawns banked instead of discarded; upgrade inflator softened from quadratic (×24.8 top) to u^1.5.
- Juice: squash/stretch pops, coin-flight to the cash chip, first-placement and milestone celebrations, audio master gain + pitch jitter + keyboard-triggered AudioContext.
- Perf: static set-dressing baked to an offscreen layer; backing store right-sized to CSS px (4.8× fewer pixels); gradient/measureText/DOM-write caches.

**Corrections to earlier sections:** the §5 "starved client rate 40–60%" figure is stale — measured 8–12% on the current build. The §3 Round-4 claim that "demand slightly exceeds supply" no longer held before this round (lobby ~75% empty); the patience cut partially restores tension. VIP orders pay 5× — now labeled in the shop and on the crown, it was previously invisible.

**Measured after (22-min bot, 3+ runs):** Dubai affordable at min 18.5–20.7 (was: never), cash@20m $1.3k–3.5k (was ~$0.5k), walkouts 4–11 (was 0), gross/hour 49–66k, all 60+ harness assertions green.

## Round 14 — Scale, contrast, and an art pipeline (2026-08-25)

Three notes from the player, all acted on.

**Contrast was too strong.** The sun was at 0.95 with hemisphere fill at 0.62, so
every box carried a hard shadow and a bright cap. Rebalanced to sun 0.42 /
hemisphere 0.82, floor grout from 0.20 to 0.09 alpha, tile shade 0.86 to 0.96,
cap highlight 1.18 to 1.07, walls and sky pulled back. Same geometry, far calmer
image.

**Characters were less than half Pizza Ready's size.** Measured properly this
time: the earlier estimate ignored that a *vertical* object under a tilted camera
projects at `sin θ`, not full length, which cost a factor of ~0.55. Measured on
the live camera instead of computing it: characters were 5.5% of screen height
against Pizza Ready's 7.8–10.7%. Solved by camera angle rather than by scaling
people — `d = VIEW_W × 2.4` at height `0.82d` gives **9.4%**, their typical value.

That reframing exposed the real problem: a 900-unit-wide floor against a
460-unit visible band, so half the office and its labels sat off-frame. Pizza
Ready's play area is about one screen wide, so the floor was narrowed to 700 and
the pipeline column now fills the frame. Camera bounds are no longer guessed —
`GL_HALF_W/GL_NEAR/GL_FAR` were measured by walking the ground plane out until it
left the viewport. Furniture was re-proportioned against a 114-unit person (desk
at waist, cubicle at chest) rather than the near-shoulder-height slabs it had.

**"The 3D icons are poor — what format should my designer provide?"** The honest
answer is that primitives will never look modelled, so the fix is an asset
pipeline, not more tuning. Added `GLTFLoader` and an `ART` manifest: name a `.glb`
and it replaces the primitive; leave it blank and the primitive stays, so a
partial art delivery works. `fitArt` scales props to their ground footprint
(height follows the artist's proportions, so a monitor rises above the desk
instead of shrinking it) and characters by height (so all seven match). Character
models are looked up by node name — `Body` is tinted at runtime for
industry-coloured candidates and VIP clients.

Verified end to end rather than assumed: `assets/_reference-desk.glb` is generated
byte-by-byte in the repo, loads through the real game path, and lands at exactly
its reserved 212 × 104 footprint with its base on the floor. `ASSETS.md` is the
spec to hand the designer.


## Round 15 — Reverted to 2D (2026-08-25)

Player call: back to the 2D renderer. `agency-empire.html` is restored to the
last flat build (`d814a1c`), which keeps everything that is not renderer-specific
— the $5,000 start, follow camera, phased build-out with tasks and levels, the
settings menu, and the full economy. The 3D work is preserved intact on the
**`3d-renderer`** branch and can be restored at any time; `ASSETS.md` stays as
the brief for a designer, flagged with where the loader actually lives.

One thing did carry back. The build-out test had been flaky for two rounds, and
the fix in Round 13 was wrong: I had blamed a single test resume being eaten by
the ~18% screening reject roll and queued six instead, which only cut the failure
rate from ~18% to ~3%. Instrumenting the actual failure showed screening *had*
run — the queue drained from 6 to 4 and both resumes were rejected — so the
assertion was testing an RNG outcome, not the behaviour it named. It now asserts
that screening consumed input at all, which is what "screening starts only once
the desk is built" actually means. 12 consecutive green runs.

## Round 16 — Zoomed out to the whole floor (2026-08-25)

`VIEW_W` 620 -> 900. The camera showed 620 of a 900-wide floor and panned to
cover the rest; it now fits the entire office on screen at once, so every station
is visible together and the camera never moves. `clampCam` already centred the
world when the visible area exceeded it, so no other change was needed.

That exposed a latent bug rather than causing one. `UI_SCALE` (which grows as the
world shrinks, to keep in-world labels legible) was being applied to the
bottom-right Placed/Rejected/Lost line — but that line is drawn in *screen* space
after `screenTransform()`, already in CSS pixels. It had always been slightly too
big; at the wider zoom it grew to 22px and dominated the screen. It now uses a
literal CSS-pixel font like the other screen-space HUD elements do. In-world
labels still scale, which is what `UI_SCALE` is for.

## Round 17 — Aspect-ratio zoom, and two stale tests (2026-08-25)

A screenshot from a wide, short browser window showed the office enormously
magnified — perhaps a fifth of it on screen. The cause was that the zoom had
always been derived from width alone (`WS = cssW / VIEW_W`). That is harmless on
a portrait phone and badly wrong anywhere else: at 1990x760 it gave 2.2 px per
world unit and cropped away three quarters of the floor. `WS` now fits **both**
axes (`min(cssW/VIEW_W, cssH/VIEW_H)`), so the whole office stays visible at any
window shape. Phones are unaffected — width is still the binding constraint there.

Fitting both axes leaves wide windows with the office as a column in the middle,
so two things follow it now: the room sits on a darker surround that reads as
deliberate framing rather than blank wall, and the HUD (flag, cash, settings,
level bar) plus the footer stats are anchored to the play column instead of the
window corners, where they had been stranding themselves hundreds of pixels from
the game.

Two intermittent test failures surfaced during this and turned out to be test
bugs, not game bugs:

- *"task did not advance after building"* — the same root cause as the screening
  assertion in Round 15. Tutorial task 3 only completes once a candidate survives
  the ~18% reject roll, so the following assertion inherited the same coin flip.
  There is now a bounded `tickUntil` that waits for the outcome rather than
  hoping a fixed tick count covers it.
- *"fee did not drop at the client"* — asserted the fee landed within 110 units
  of x=322, a constant from an older layout. The client actually stands at x=372
  and bills scatter 14-66 units from where they drop, so a bill thrown rightward
  could reach 438 and fail. It now checks against the client's real position with
  a tolerance matching the actual scatter.

Both were only visible across repeated runs; a 60-run sweep on a frozen build is
what caught them, after a first sweep was invalidated by editing the game
mid-flight.
