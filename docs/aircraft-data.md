# N46060 aircraft data

Every number in `src/model/aircraft.ts`, where it came from, and how far it has been checked.
`src/model/aircraft.test.ts` pins each value, so a change fails a test until this file and the pin are updated in the same commit.

**Nothing below is verified against the airplane's current records.** The in-app notice says so and stays until this file shows every row verified.

Status key:

- **Given**: supplied by the owner from the airplane's own records.
- **Read**: measured by eye from a photograph of a handbook graph. Good to roughly 1 to 2 percent, and the photos are taken at an angle.
- **Corroborated**: the read value also matches published 172-series figures found on third-party sites. Third-party figures are not authoritative.
- **Verified**: checked against the handbook text, the TCDS or the weight and balance record by a reviewer. No row has this status yet.

## Airplane

| Value                 | Used           | Source                                                                  | Status |
| --------------------- | -------------- | ----------------------------------------------------------------------- | ------ |
| Empty weight          | 1,392 lb       | Weighed record, supplied by the owner                                   | Given  |
| Empty moment          | 53,325.6 lb-in | Same record. 53,325.6 ÷ 1,392 = 38.31 in, which matches the CG supplied | Given  |
| Date of last weighing | not recorded   | Needed so a reviewer can confirm the record is current                  | Open   |

## Loading graph (handbook, loading graph page)

The graph draws one straight line from zero for each station, so a station's moment is its weight times a fixed arm. The arm is the line's slope.

| Station                   | Arm (in) | Limit                     | Source                                                                        | Status                    |
| ------------------------- | -------- | ------------------------- | ----------------------------------------------------------------------------- | ------------------------- |
| Pilot and front passenger | 37       |                           | Slope: about 14.8 thousand lb-in at 400 lb                                    | Read, corroborated        |
| Rear passengers           | 73       |                           | Slope: about 28.8 thousand lb-in at 394 lb                                    | Read, corroborated        |
| Baggage or auxiliary seat | 95       | 120 lb ("120# MAX" label) | See the baggage note below                                                    | Read, partly contradicted |
| Fuel                      | 48       | 38 gal usable, 6 lb/gal   | Line labelled "FUEL (6 LBS/GAL)", ends at "38 GAL MAX" near 11 thousand lb-in | Read, corroborated        |

**Baggage note.** Measuring the end of the baggage line on the photo gives an arm nearer 97 to 99 than 95. 95 is the published 172-series baggage area 1 arm, so it was used. A larger arm is the cautious direction for the aft limit but not for the forward limit, so this value cannot simply be rounded up. Check it against a worked loading example in the handbook.

## CG moment envelope (handbook page 3-6)

| Value                        | Used     | Source                                             | Status                        |
| ---------------------------- | -------- | -------------------------------------------------- | ----------------------------- |
| Normal maximum weight        | 2,300 lb | Top edge of the normal envelope                    | Read, corroborated            |
| Utility maximum weight       | 2,000 lb | Top edge of the utility envelope                   | Read, corroborated            |
| Forward limit up to 1,950 lb | 35.0 in  | Left edge, bottom to the bend. 52.5 ÷ 1,500 = 35.0 | Read, corroborated            |
| Forward limit at 2,300 lb    | 38.5 in  | Top-left corner of the normal envelope             | **Read, partly contradicted** |
| Normal aft limit             | 47.3 in  | Right edge of the normal envelope                  | **Read, partly contradicted** |
| Utility aft limit            | 40.5 in  | Right edge of the utility envelope                 | Read, corroborated            |

Two of these need a human check first, because the photo disagrees with the value used:

1. **Normal aft limit.** The photo reads about 46.4 to 46.9 in. 47.3 in is the figure published for the 172 series and was used. If the true limit is lower, **the app is permissive by up to about 0.9 in at the aft end.** This is the highest-priority item to verify, because aft CG is the dangerous direction.
2. **Forward limit at 2,300 lb.** The photo reads about 38.0 to 38.2 in. 38.5 was used, which also puts the limit at 35.5 in at 2,000 lb, matching the photo. If the true value is lower, the app is conservative at heavy weights.

The handbook text or the TCDS (3A12) states these limits as numbers and settles both questions.

## Modelling choices a reviewer should know about

- **Interpolation of the forward limit.** The model interpolates linearly in CG arm between 1,950 lb (35.0 in) and 2,300 lb (38.5 in), which is how limits are normally published. The handbook chart draws a straight line in moment space between those corners. The two differ by at most 0.144 in, at about 2,120 lb, and the chart's line is the more restrictive. A loading within 0.144 in of the forward limit in that weight range can pass the check yet plot a hair outside the drawn outline. Switching to the chart's method means interpolating moment instead of arm in `forwardLimitIn`.
- **Below 1,500 lb.** The handbook chart stops at 1,500 lb. The forward limit is held at 35.0 in below that, and the outline is drawn down to 1,500 lb only. A loading under 1,500 lb is checked against the extended limits.
- **Fuel.** "Fuel loaded" is treated as the fuel on board at takeoff. Taxi and run-up burn is not credited at takeoff. This is cautious for maximum weight. "Fuel burned" covers taxi, run-up and flight, and landing is takeoff fuel minus that.
- **Empty weight convention.** The weighed empty weight is assumed to include unusable fuel and full oil, as is standard for the handbook. Confirm against the record.
- **Not modelled.** Any utility-category restriction on rear seats, baggage or maneuvers, ramp versus takeoff weight, and equipment changes since the last weighing.

## Open questions for the owner

1. The handbook's CG limits as written (inches aft of datum) for normal and utility, at the weights where they change.
2. A worked example from the handbook, to compare against `aircraft.test.ts`.
3. The date of the last weighing and whether equipment has changed since.
4. Any utility-category loading restrictions in the limitations section.
