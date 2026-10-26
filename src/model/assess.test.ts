import { describe, expect, it } from 'vitest';
import { NO_LOAD, TEST_AIRCRAFT, loadCaseAt } from '../test/fixtures';
import { assessFlight, checkEnvelope, checkStationLimits } from './assess';

describe('checkEnvelope', () => {
  it('passes a load inside the envelope', () => {
    expect(checkEnvelope(TEST_AIRCRAFT, 'normal', loadCaseAt(1500, 40))).toEqual([]);
  });

  it('treats the aft limit as inclusive', () => {
    expect(checkEnvelope(TEST_AIRCRAFT, 'normal', loadCaseAt(1500, 45))).toEqual([]);
  });

  it('fails a load just behind the aft limit', () => {
    const [violation, ...others] = checkEnvelope(TEST_AIRCRAFT, 'normal', loadCaseAt(1500, 45.01));

    expect(others).toEqual([]);
    expect(violation).toMatchObject({ kind: 'aftOfLimit', limitIn: 45 });
    expect(violation).toHaveProperty('marginIn', expect.closeTo(0.01, 10));
  });

  it('treats the forward limit as inclusive and moves it with weight', () => {
    // The fixture's forward limit is 35 in at 1500 lb.
    expect(checkEnvelope(TEST_AIRCRAFT, 'normal', loadCaseAt(1500, 35))).toEqual([]);

    const [violation] = checkEnvelope(TEST_AIRCRAFT, 'normal', loadCaseAt(1500, 34.99));
    expect(violation).toMatchObject({ kind: 'forwardOfLimit', limitIn: 35 });
  });

  it('allows a CG that would be forward at a heavier weight', () => {
    // 33 in is within limits at 1100 lb (limit 31) but forward of the limit at 1500 lb (35).
    expect(checkEnvelope(TEST_AIRCRAFT, 'normal', loadCaseAt(1100, 33))).toEqual([]);
    expect(checkEnvelope(TEST_AIRCRAFT, 'normal', loadCaseAt(1500, 33))).toHaveLength(1);
  });

  it('treats the maximum weight as inclusive', () => {
    expect(checkEnvelope(TEST_AIRCRAFT, 'normal', loadCaseAt(2000, 42))).toEqual([]);
  });

  it('fails a load over the maximum weight', () => {
    expect(checkEnvelope(TEST_AIRCRAFT, 'normal', loadCaseAt(2001, 42))).toEqual([
      { kind: 'overMaxWeight', excessLb: 1, maxWeightLb: 2000 },
    ]);
  });

  it('applies the utility category limits when selected', () => {
    const loadCase = loadCaseAt(1500, 43);

    expect(checkEnvelope(TEST_AIRCRAFT, 'normal', loadCase)).toEqual([]);
    expect(checkEnvelope(TEST_AIRCRAFT, 'utility', loadCase)).toMatchObject([
      { kind: 'aftOfLimit', limitIn: 41 },
    ]);
    expect(checkEnvelope(TEST_AIRCRAFT, 'utility', loadCaseAt(1501, 38))).toMatchObject([
      { kind: 'overMaxWeight', excessLb: 1, maxWeightLb: 1500 },
    ]);
  });

  it('reports every violation at once', () => {
    const kinds = checkEnvelope(TEST_AIRCRAFT, 'normal', loadCaseAt(2100, 20)).map(
      (violation) => violation.kind,
    );

    expect(kinds).toEqual(['overMaxWeight', 'forwardOfLimit']);
  });
});

describe('checkStationLimits', () => {
  it('passes loads at the station limits', () => {
    const inputs = { ...NO_LOAD, baggageLb: 100, fuelGallons: 20 };

    expect(checkStationLimits(TEST_AIRCRAFT, inputs)).toEqual([]);
  });

  it('flags baggage over the limit', () => {
    expect(checkStationLimits(TEST_AIRCRAFT, { ...NO_LOAD, baggageLb: 101 })).toEqual([
      { kind: 'baggageOverMax', excessLb: 1, maxWeightLb: 100 },
    ]);
  });

  it('flags fuel over the usable quantity', () => {
    expect(checkStationLimits(TEST_AIRCRAFT, { ...NO_LOAD, fuelGallons: 20.5 })).toEqual([
      { kind: 'fuelOverUsable', excessGal: 0.5, usableGal: 20 },
    ]);
  });
});

describe('invalid numbers', () => {
  // NaN fails every comparison, so an unguarded check would report "within limits".
  const BAD_VALUES = [Number.NaN, Number.POSITIVE_INFINITY, -1];

  it.each(BAD_VALUES)('checkEnvelope throws for a load case with weight %f', (weightLb) => {
    expect(() => checkEnvelope(TEST_AIRCRAFT, 'normal', loadCaseAt(weightLb, 40))).toThrow(
      RangeError,
    );
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY])(
    'checkEnvelope throws for a load case with CG %f',
    (cgIn) => {
      expect(() => checkEnvelope(TEST_AIRCRAFT, 'normal', loadCaseAt(1500, cgIn))).toThrow(
        RangeError,
      );
    },
  );

  it.each(['fuelBurnedGallons', 'frontSeatsLb', 'fuelGallons'] as const)(
    'assessFlight throws when %s is not a valid quantity',
    (field) => {
      for (const value of BAD_VALUES) {
        expect(() => assessFlight(TEST_AIRCRAFT, 'normal', { ...NO_LOAD, [field]: value })).toThrow(
          RangeError,
        );
      }
    },
  );
});

describe('assessFlight', () => {
  // Hand check, takeoff: weight 1000 + 100 + 100 (fuel) = 1200 lb, moment
  // 40000 + 1000 + 4000 = 45000, CG 37.5 in against a 32 in forward limit.
  // Landing: 12 gal = 60 lb fuel, weight 1160 lb, CG 37.41 in against 31.6 in.
  const inputs = {
    ...NO_LOAD,
    frontSeatsLb: 100,
    rearSeatsLb: 0,
    baggageLb: 0,
    fuelGallons: 20,
    fuelBurnedGallons: 8,
  };

  it('computes landing with the burned fuel removed', () => {
    const { takeoff, landing } = assessFlight(TEST_AIRCRAFT, 'normal', inputs);

    expect(takeoff.loadCase.weightLb).toBe(1200);
    expect(landing.loadCase.weightLb).toBe(1160);
  });

  it('reports no violations for a flight within limits', () => {
    const { takeoff, landing } = assessFlight(TEST_AIRCRAFT, 'normal', inputs);

    expect(takeoff.violations).toEqual([]);
    expect(landing.violations).toEqual([]);
  });

  it('keeps station violations on takeoff only', () => {
    const { takeoff, landing } = assessFlight(TEST_AIRCRAFT, 'normal', {
      ...inputs,
      baggageLb: 150,
    });

    expect(takeoff.violations).toContainEqual({
      kind: 'baggageOverMax',
      excessLb: 50,
      maxWeightLb: 100,
    });
    expect(landing.violations.map((violation) => violation.kind)).not.toContain('baggageOverMax');
  });

  it('reports burning more fuel than was loaded and lands with empty tanks', () => {
    const { landing } = assessFlight(TEST_AIRCRAFT, 'normal', {
      ...inputs,
      fuelGallons: 5,
      fuelBurnedGallons: 8,
    });

    expect(landing.violations).toContainEqual({ kind: 'burnExceedsFuel', excessGal: 3 });
    expect(landing.loadCase.lines.find((line) => line.id === 'fuel')?.weightLb).toBe(0);
  });

  it('assesses each end of the flight against the envelope separately', () => {
    // Takeoff: 1000 + 420 + 100 (fuel) = 1520 lb, over the 1500 lb utility limit.
    // Landing: 10 gal burned = 50 lb, so 1470 lb, back under it. Only the weight
    // check is asserted; the CG violations this loading also has are not the point.
    const { takeoff, landing } = assessFlight(TEST_AIRCRAFT, 'utility', {
      ...NO_LOAD,
      frontSeatsLb: 420,
      fuelGallons: 20,
      fuelBurnedGallons: 10,
    });

    expect(takeoff.violations.map((violation) => violation.kind)).toContain('overMaxWeight');
    expect(landing.violations.map((violation) => violation.kind)).not.toContain('overMaxWeight');
  });
});
