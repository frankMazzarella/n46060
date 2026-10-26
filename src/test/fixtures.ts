import type { Aircraft, FlightInputs, LoadCase } from '../model';

/**
 * A synthetic aircraft with round numbers so tests can be checked by hand and
 * keep passing when the reviewed N46060 data is corrected.
 */
export const TEST_AIRCRAFT: Aircraft = {
  registration: 'TEST',
  description: 'Synthetic aircraft for unit tests',
  emptyWeightLb: 1000,
  emptyMomentLbIn: 40_000,
  stations: {
    frontSeats: { armIn: 10 },
    rearSeats: { armIn: 20 },
    baggage: { armIn: 30, maxWeightLb: 100 },
    fuel: { armIn: 40 },
  },
  fuel: { usableGallons: 20, poundsPerGallon: 5 },
  categories: {
    normal: { maxWeightLb: 2000, aftLimitIn: 45 },
    utility: { maxWeightLb: 1500, aftLimitIn: 41 },
  },
  forwardLimit: [
    { weightLb: 1000, armIn: 30 },
    { weightLb: 2000, armIn: 40 },
  ],
};

export const NO_LOAD: FlightInputs = {
  emptyWeightLb: TEST_AIRCRAFT.emptyWeightLb,
  emptyMomentLbIn: TEST_AIRCRAFT.emptyMomentLbIn,
  frontSeatsLb: 0,
  rearSeatsLb: 0,
  baggageLb: 0,
  fuelGallons: 0,
  fuelBurnedGallons: 0,
};

/** A load case with only the totals that envelope checks read. */
export function loadCaseAt(weightLb: number, cgIn: number): LoadCase {
  return { lines: [], weightLb, momentLbIn: weightLb * cgIn, cgIn };
}
