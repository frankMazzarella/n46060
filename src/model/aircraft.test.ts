import { describe, expect, it } from 'vitest';
import { assessFlight } from './assess';
import { N46060 } from './aircraft';
import { envelopeOutline, forwardLimitIn } from './envelope';
import { buildLoadCase } from './loadCase';

/**
 * These tests pin the reviewed N46060 data. If one fails after a data change,
 * update the pin together with docs/aircraft-data.md, in the same commit.
 */
describe('N46060 reviewed data', () => {
  it('matches the weighed empty condition', () => {
    const empty = buildLoadCase(N46060, {
      emptyWeightLb: N46060.emptyWeightLb,
      emptyMomentLbIn: N46060.emptyMomentLbIn,
      frontSeatsLb: 0,
      rearSeatsLb: 0,
      baggageLb: 0,
      fuelGallons: 0,
    });

    expect(empty.weightLb).toBe(1392);
    expect(empty.momentLbIn).toBe(53_325.6);
    expect(empty.cgIn).toBeCloseTo(38.31, 2);
  });

  it('pins the station arms and limits', () => {
    expect(N46060.stations).toEqual({
      frontSeats: { armIn: 37 },
      rearSeats: { armIn: 73 },
      baggage: { armIn: 95, maxWeightLb: 120 },
      fuel: { armIn: 48 },
    });
    expect(N46060.fuel).toEqual({ usableGallons: 38, poundsPerGallon: 6 });
  });

  it('pins the category limits', () => {
    expect(N46060.categories).toEqual({
      normal: { maxWeightLb: 2300, aftLimitIn: 47.3 },
      utility: { maxWeightLb: 2000, aftLimitIn: 40.5 },
    });
  });

  it('pins the forward limit', () => {
    expect(forwardLimitIn(N46060, 1500)).toBe(35);
    expect(forwardLimitIn(N46060, 1950)).toBe(35);
    expect(forwardLimitIn(N46060, 2125)).toBeCloseTo(36.75, 10);
    expect(forwardLimitIn(N46060, 2300)).toBe(38.5);
  });

  it('keeps forward-limit points ascending and utility within normal', () => {
    const weights = N46060.forwardLimit.map((point) => point.weightLb);

    expect(weights).toEqual([...weights].sort((a, b) => a - b));
    expect(N46060.categories.utility.maxWeightLb).toBeLessThanOrEqual(
      N46060.categories.normal.maxWeightLb,
    );
  });

  it('draws the normal envelope with the handbook corner moments', () => {
    const corners = envelopeOutline(N46060, 'normal', 1500).map((point) => [
      point.weightLb,
      point.momentThousandsLbIn,
    ]);

    expect(corners).toEqual([
      [1500, expect.closeTo(52.5, 6)],
      [1950, expect.closeTo(68.25, 6)],
      [2300, expect.closeTo(88.55, 6)],
      [2300, expect.closeTo(108.79, 6)],
      [1500, expect.closeTo(70.95, 6)],
    ]);
  });

  it('assesses a worked loading: two up, baggage, full fuel', () => {
    const { takeoff, landing } = assessFlight(N46060, 'normal', {
      emptyWeightLb: N46060.emptyWeightLb,
      emptyMomentLbIn: N46060.emptyMomentLbIn,
      frontSeatsLb: 340,
      rearSeatsLb: 0,
      baggageLb: 20,
      fuelGallons: 38,
      fuelBurnedGallons: 8,
    });

    // Moment: 53325.6 + 340*37 + 20*95 + 228*48 = 78749.6
    expect(takeoff.loadCase.weightLb).toBe(1980);
    expect(takeoff.loadCase.momentLbIn).toBeCloseTo(78_749.6, 6);
    // 78749.6 / 1980 = 39.77253 (hand calculation).
    expect(takeoff.loadCase.cgIn).toBeCloseTo(39.7725, 4);
    expect(takeoff.violations).toEqual([]);
    expect(landing.loadCase.weightLb).toBe(1932);
    expect(landing.violations).toEqual([]);
  });
});
