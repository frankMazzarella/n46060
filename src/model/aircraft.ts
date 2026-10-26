import type { Aircraft } from './types';

/**
 * N46060, a 1968 Cessna 172I.
 *
 * This is reviewed data, not configuration. Change a value only together with
 * its source in docs/aircraft-data.md and the matching pin in aircraft.test.ts.
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
    baggage: { armIn: 95, maxWeightLb: 120 },
    fuel: { armIn: 48 },
  },
  fuel: { usableGallons: 38, poundsPerGallon: 6 },

  // Read from the handbook CG moment envelope (page 3-6).
  categories: {
    normal: { maxWeightLb: 2300, aftLimitIn: 47.3 },
    utility: { maxWeightLb: 2000, aftLimitIn: 40.5 },
  },
  forwardLimit: [
    { weightLb: 1950, armIn: 35 },
    { weightLb: 2300, armIn: 38.5 },
  ],
};
