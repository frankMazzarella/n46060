# Review guide

This is safety-relevant software. A wrong "within limits" can put an overloaded or badly balanced airplane in the air, so review should be slow and adversarial. This guide says where to start and which decisions deserve the most doubt.

## Read in this order

1. `docs/aircraft-data.md`. The numbers, their sources, and what is unverified. Most real risk is here, not in the code.
2. `src/model/`. Pure functions, no React. The calculation and the limit checks. About 400 lines.
3. `src/controller/`. Turns typed text into model inputs. Strict about what counts as a number.
4. `src/view/`. Presentation only. It never recomputes anything.

## Architecture

```
typed text ──▶ controller ──▶ model ──▶ view
(strings)      parseForm      assessFlight   components
               form reducer   (pure)         messages, format
               useWeightBalance
```

| Layer      | Folder           | Rule                                                                  |
| ---------- | ---------------- | --------------------------------------------------------------------- |
| Model      | `src/model`      | No React, no DOM, no strings for users. Data in, data out.            |
| Controller | `src/controller` | Holds form state and parses it. Contains no weight and balance rules. |
| View       | `src/view`       | Renders what the controller gives it. Contains no calculation.        |

Dependencies only point one way: view → controller → model. The model imports nothing from the others.

## Decisions to challenge

- **Fail loudly on bad numbers.** NaN fails every `<` and `>` comparison, so an unguarded check would report "within limits". `buildLoadCase`, `assessFlight` and `checkEnvelope` throw `RangeError` on a negative or non-finite value (`src/model/quantity.ts`). The app-level `ErrorBoundary` then replaces the whole page with a warning instead of showing a result.
- **Strict input parsing.** `parseForm` accepts plain decimal digits only. `-5`, `1e3`, `1,5`, `Infinity` and `12a` are rejected. A blank field is never treated as zero.
- **Every load field starts blank.** The pilot must enter each load quantity, including 0, so no value is assumed. Two exceptions, both deliberate: fuel burned is optional (blank means none, landing equals takeoff), and the empty weight and moment start at the weighed record and may be overridden. Empty weight and moment must be above zero (the weight is a divisor in the CG), and results warn whenever either differs from the record. The slider alone is an estimate (weight moves, empty CG arm held); the reducer case `emptyWeightSlid` is the one place the app computes an input for the pilot. Nothing is saved between visits, so a loading from a previous flight cannot be mistaken for the current one. There is no local storage and no editable aircraft data.
- **Aircraft data is code, not configuration.** It lives in `src/model/aircraft.ts`, is pinned by tests, and changes through review.
- **Limits are inclusive and exact.** A load exactly on a limit passes and anything beyond it fails, with no rounding tolerance. Floating point can in principle make a load exactly on a limit fail by one part in 10^14, which errs on the cautious side.
- **A failing margin never displays as zero.** `formatExcess` shows "less than 0.01" instead of "0.00".
- **Status is never colour alone.** Results use the words "Within limits" and "Out of limits". Chart markers are circles when within limits and diamonds when not.
- **Off-chart points are labelled.** A point outside the chart axes is pinned to the edge and labelled "off chart", so it does not look like a reading taken at the edge.
- **Landing is clamped, and flagged.** Burning more fuel than was loaded lands with empty tanks and reports `burnExceedsFuel`. It is not silently clamped.

## What the tests cover

`npm run test:run` runs everything.

- **Model.** Totals and CG on hand-calculated cases. Forward limit at, between and beyond its points. Inclusive boundaries on every limit, one step either side. Every violation kind. Invalid numbers throw. The N46060 data is pinned, including a worked loading checked by hand (1,980 lb, CG 39.77 in).
- **Controller.** The parser against valid, invalid and blank text, including values a browser number field would silently mangle. The reducer. The hook.
- **View.** The real app, driven as a user would: no results until complete, results on completion, overweight, bad text, category switch, burn greater than fuel, blank burn, empty weight slider and reset, clear, worksheet, off-chart label. The error boundary replaces the page when something throws.

Not covered: the chart's geometry beyond its scale helpers, and any browser other than jsdom. The layout was checked by hand in Chromium at 1280 and 390 px wide, in light and dark.

## Known gaps

- Aircraft data is unverified. See `docs/aircraft-data.md`.
- The forward limit is interpolated in arm, while the handbook chart interpolates in moment. Difference at most 0.144 in.
- Utility-category restrictions beyond weight and CG are not modelled.
- Third-party GitHub Actions are pinned by version tag, not by commit hash. Pin by hash if the repository is held to that standard.
- No offline support. The page needs a network the first time it loads.

## Commands

| Command          | What it does                                           |
| ---------------- | ------------------------------------------------------ |
| `npm run dev`    | Dev server                                             |
| `npm run verify` | Typecheck, lint, format check, tests, production build |
| `npm run test`   | Tests in watch mode                                    |
| `npm run format` | Rewrite files with Prettier                            |
