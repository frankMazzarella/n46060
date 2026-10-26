# Open items

Things that must be settled before anyone relies on this calculator. Each has an ID, and the matching spot in the code carries a `TODO(Vn)` comment. To list them all:

```sh
grep -rn "TODO(V" src
```

Close an item by fixing it, updating the pin in `src/model/aircraft.test.ts` and the status in `docs/aircraft-data.md` in the same commit, and deleting its `TODO(Vn)` comment and its row here.

| ID  | Item                                                           | Risk                                             | Where in the code                                             |
| --- | -------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------- |
| V1  | Normal aft limit may be too generous                           | **High.** Permissive in the dangerous direction. | `src/model/aircraft.ts`, `categories.normal.aftLimitIn`       |
| V2  | Forward limit at 2,300 lb is read higher than the photo        | Low. Conservative if the photo is right.         | `src/model/aircraft.ts`, `forwardLimit`                       |
| V3  | Baggage arm is read higher than the value used                 | Medium. Direction depends on the loading.        | `src/model/aircraft.ts`, `stations.baggage`                   |
| V4  | Forward limit interpolated in arm, handbook chart is in moment | Low. Up to 0.144 in, chart is the stricter.      | `src/model/envelope.ts`, `forwardLimitIn`                     |
| V5  | All aircraft data is unverified                                | **High** until closed.                           | `src/model/aircraft.ts`, `src/view/components/Disclaimer.tsx` |
| V6  | Tested by automated tests and by eye only, never reviewed      | Medium.                                          | `src/view/components/EnvelopeChart.tsx`                       |

## V1. Normal aft limit

The code uses 47.3 in, the figure published for the 172 series. The photo of the handbook CG moment envelope (page 3-6) reads about 46.4 to 46.9 in. If the real limit is lower, **the calculator reports "within limits" for loadings up to about 0.9 in too far aft.**

Close it with the CG range as written in the handbook or TCDS 3A12 for the 172I.

## V2. Forward limit at 2,300 lb

The code uses 38.5 in, which also gives 35.5 in at 2,000 lb, matching the photo. The photo reads about 38.0 to 38.2 in at 2,300 lb. If the photo is right, the calculator is conservative at heavy weights.

Close it with the written forward limit at 2,300 lb.

## V3. Baggage arm

The code uses 95 in, the published 172-series baggage area 1 arm. Measuring the end of the baggage line on the loading graph photo gives 97 to 99 in. A larger arm is the cautious direction for the aft limit but not for the forward limit, so the value cannot be rounded up to be safe.

Close it with a worked loading example from the handbook that includes baggage.

## V4. Forward limit interpolation

`forwardLimitIn` interpolates linearly in CG arm between 1,950 lb (35.0 in) and 2,300 lb (38.5 in). The handbook chart draws a straight line in moment space between those corners. They differ by at most 0.144 in, near 2,120 lb, and the chart's line is stricter. A loading within that margin of the forward limit can pass the check yet plot a hair outside the drawn outline.

Close it by deciding which method is authoritative. If the chart is, interpolate moment instead of arm in `forwardLimitIn` and update its tests.

## V5. Aircraft data is unverified

Every value in `src/model/aircraft.ts` came from the owner's weighing record or from photographs of the handbook graphs, cross-checked against third-party 172-series figures. None has been checked against the handbook text, the TCDS or the current weight and balance record. The notice in the app says so, and stays until this item closes.

Close it by setting every row in `docs/aircraft-data.md` to Verified, then removing the notice text about unverified data from `Disclaimer.tsx`.

Needed from the handbook and the airplane's records:

1. The CG limits as written, in inches aft of datum, for normal and utility, at the weights where they change.
2. One worked loading example, to add as a test.
3. The date of the last weighing, and whether equipment has changed since.
4. Any utility-category loading restrictions in the limitations section.
5. Confirmation that the weighed empty weight includes unusable fuel and full oil.

## V6. Testing and review

The model, controller and view logic are covered by 119 automated tests. The chart's drawing and marker placement are not, beyond its scale helpers. The layout was checked once by eye in Chromium at 1280 and 390 px wide, in light and dark. No human has reviewed any of it yet.

Close it with a code review of `docs/review-guide.md`'s decisions, and a test for the chart's marker placement.
