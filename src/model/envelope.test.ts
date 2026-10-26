import { describe, expect, it } from 'vitest';
import { TEST_AIRCRAFT } from '../test/fixtures';
import { envelopeOutline, forwardLimitIn, toMomentThousands } from './envelope';

describe('toMomentThousands', () => {
  it('divides by one thousand', () => {
    expect(toMomentThousands(53_325.6)).toBeCloseTo(53.3256, 10);
  });
});

describe('forwardLimitIn', () => {
  it.each([
    [500, 30, 'holds the first value below the first point'],
    [1000, 30, 'equals the first value at the first point'],
    [1250, 32.5, 'interpolates between points'],
    [1500, 35, 'interpolates at the midpoint'],
    [2000, 40, 'equals the last value at the last point'],
    [2500, 40, 'holds the last value above the last point'],
  ])('at %i lb is %d in (%s)', (weightLb, expectedIn) => {
    expect(forwardLimitIn(TEST_AIRCRAFT, weightLb)).toBeCloseTo(expectedIn, 10);
  });

  it('interpolates across each segment when there are more than two points', () => {
    const aircraft = {
      ...TEST_AIRCRAFT,
      forwardLimit: [
        { weightLb: 1000, armIn: 30 },
        { weightLb: 1500, armIn: 30 },
        { weightLb: 2000, armIn: 40 },
      ],
    } as const;

    expect(forwardLimitIn(aircraft, 1250)).toBeCloseTo(30, 10);
    expect(forwardLimitIn(aircraft, 1750)).toBeCloseTo(35, 10);
  });
});

describe('envelopeOutline', () => {
  it('runs up the forward limit then down the aft limit for the normal category', () => {
    expect(envelopeOutline(TEST_AIRCRAFT, 'normal', 800)).toEqual([
      { momentThousandsLbIn: 24, weightLb: 800 },
      { momentThousandsLbIn: 30, weightLb: 1000 },
      { momentThousandsLbIn: 80, weightLb: 2000 },
      { momentThousandsLbIn: 90, weightLb: 2000 },
      { momentThousandsLbIn: 36, weightLb: 800 },
    ]);
  });

  it('stops the utility envelope at its own maximum weight', () => {
    expect(envelopeOutline(TEST_AIRCRAFT, 'utility', 800)).toEqual([
      { momentThousandsLbIn: 24, weightLb: 800 },
      { momentThousandsLbIn: 30, weightLb: 1000 },
      { momentThousandsLbIn: 52.5, weightLb: 1500 },
      { momentThousandsLbIn: 61.5, weightLb: 1500 },
      { momentThousandsLbIn: 32.8, weightLb: 800 },
    ]);
  });

  it('adds no bend vertex for a forward-limit point at or below the floor', () => {
    const weights = envelopeOutline(TEST_AIRCRAFT, 'normal', 1000).map((point) => point.weightLb);

    expect(weights).toEqual([1000, 2000, 2000, 1000]);
  });
});
