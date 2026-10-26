import { describe, expect, it } from 'vitest';
import { NO_LOAD, TEST_AIRCRAFT } from '../test/fixtures';
import { buildLoadCase } from './loadCase';

describe('buildLoadCase', () => {
  it('returns the empty airplane when nothing is loaded', () => {
    const loadCase = buildLoadCase(TEST_AIRCRAFT, NO_LOAD);

    expect(loadCase.weightLb).toBe(1000);
    expect(loadCase.momentLbIn).toBe(40_000);
    expect(loadCase.cgIn).toBe(40);
  });

  it('totals weight and moment across every station', () => {
    const loadCase = buildLoadCase(TEST_AIRCRAFT, {
      frontSeatsLb: 100, // moment 1000
      rearSeatsLb: 50, // moment 1000
      baggageLb: 10, // moment 300
      fuelGallons: 10, // 50 lb, moment 2000
    });

    expect(loadCase.weightLb).toBe(1210);
    expect(loadCase.momentLbIn).toBe(44_300);
    expect(loadCase.cgIn).toBeCloseTo(44_300 / 1210, 10);
  });

  it('converts fuel from gallons to pounds using the aircraft fuel density', () => {
    const loadCase = buildLoadCase(TEST_AIRCRAFT, { ...NO_LOAD, fuelGallons: 4 });
    const fuelLine = loadCase.lines.find((line) => line.id === 'fuel');

    expect(fuelLine).toEqual({ id: 'fuel', weightLb: 20, armIn: 40, momentLbIn: 800 });
  });

  it('uses the recorded empty moment rather than weight times a rounded arm', () => {
    const emptyLine = buildLoadCase(TEST_AIRCRAFT, NO_LOAD).lines[0];

    expect(emptyLine).toEqual({ id: 'empty', weightLb: 1000, armIn: 40, momentLbIn: 40_000 });
  });

  it.each([
    ['frontSeatsLb', Number.NaN],
    ['rearSeatsLb', -1],
    ['baggageLb', Number.POSITIVE_INFINITY],
    ['fuelGallons', Number.NEGATIVE_INFINITY],
  ] as const)('throws when %s is %f', (field, value) => {
    expect(() => buildLoadCase(TEST_AIRCRAFT, { ...NO_LOAD, [field]: value })).toThrow(RangeError);
  });

  it('accepts zero for every input', () => {
    expect(() => buildLoadCase(TEST_AIRCRAFT, NO_LOAD)).not.toThrow();
  });

  it('lists lines in a fixed order', () => {
    const ids = buildLoadCase(TEST_AIRCRAFT, NO_LOAD).lines.map((line) => line.id);

    expect(ids).toEqual(['empty', 'frontSeats', 'rearSeats', 'baggage', 'fuel']);
  });
});
