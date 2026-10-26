import type { Aircraft } from './types';

/**
 * N46060, a 1968 Cessna 172I.
 *
 * This is reviewed data, not configuration. Change a value only together with
 * its source in docs/aircraft-data.md and the matching pin in aircraft.test.ts.
 *
 * TODO(V5): none of this is verified against the handbook text, the TCDS or the
 * current weight and balance record. See TODO.md.
 */
export const N46060: Aircraft = {
  registration: 'N46060',
  description: '1968 Cessna 172I',

  // Weighed empty condition from the airplane's weight and balance record.
  emptyWeightLb: 1392,
  emptyMomentLbIn: 53_325.6,

  // Arms are the slopes of the straight lines on the handbook loading graph.
  stations: {
    frontSeats: { armIn: 37 },
    rearSeats: { armIn: 73 },
    // TODO(V3): the photo of the loading graph reads 97 to 99 in, not 95. Check
    // against a worked handbook example that includes baggage.
    baggage: { armIn: 95, maxWeightLb: 120 },
    fuel: { armIn: 48 },
  },
  fuel: { usableGallons: 38, poundsPerGallon: 6 },

  // Read from the handbook CG moment envelope (page 3-6).
  categories: {
    // TODO(V1): the photo reads 46.4 to 46.9 in for the normal aft limit, not
    // 47.3. If the real limit is lower, this is permissive by up to 0.9 in.
    // Highest priority: check against the written CG range.
    normal: { maxWeightLb: 2300, aftLimitIn: 47.3 },
    utility: { maxWeightLb: 2000, aftLimitIn: 40.5 },
  },
  // TODO(V2): the photo reads 38.0 to 38.2 in at 2,300 lb, not 38.5. Conservative
  // if the photo is right.
  forwardLimit: [
    { weightLb: 1950, armIn: 35 },
    { weightLb: 2300, armIn: 38.5 },
  ],
};
