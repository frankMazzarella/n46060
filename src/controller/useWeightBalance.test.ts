import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TEST_AIRCRAFT } from '../test/fixtures';
import type { FormField } from './form';
import { useWeightBalance } from './useWeightBalance';

function fill(
  result: { current: ReturnType<typeof useWeightBalance> },
  values: Partial<Record<FormField, string>>,
): void {
  act(() => {
    for (const [field, value] of Object.entries(values) as [FormField, string][]) {
      result.current.setField(field, value);
    }
  });
}

// Hand check against the fixture aircraft: weight 1200 lb, CG 37.5 in, inside both categories.
const WITHIN_LIMITS = {
  frontSeatsLb: '100',
  rearSeatsLb: '0',
  baggageLb: '0',
  fuelGallons: '20',
  fuelBurnedGallons: '8',
};

describe('useWeightBalance', () => {
  it('has no assessment until every field is filled', () => {
    const { result } = renderHook(() => useWeightBalance(TEST_AIRCRAFT));

    expect(result.current.assessment).toBeNull();
    expect(result.current.parsed.status).toBe('incomplete');
  });

  it('assesses the flight once every field is valid', () => {
    const { result } = renderHook(() => useWeightBalance(TEST_AIRCRAFT));

    fill(result, WITHIN_LIMITS);

    expect(result.current.parsed.status).toBe('ready');
    expect(result.current.assessment?.takeoff.loadCase.weightLb).toBe(1200);
    expect(result.current.assessment?.landing.loadCase.weightLb).toBe(1160);
    expect(result.current.assessment?.takeoff.violations).toEqual([]);
  });

  it('drops the assessment again when a field becomes invalid', () => {
    const { result } = renderHook(() => useWeightBalance(TEST_AIRCRAFT));
    fill(result, WITHIN_LIMITS);

    act(() => {
      result.current.setField('baggageLb', 'oops');
    });

    expect(result.current.assessment).toBeNull();
    expect(result.current.parsed.status).toBe('invalid');
  });

  it('reassesses against the other category when it changes', () => {
    const { result } = renderHook(() => useWeightBalance(TEST_AIRCRAFT));
    // 1520 lb is under the normal maximum (2000 lb) but over the utility maximum (1500 lb).
    fill(result, { ...WITHIN_LIMITS, frontSeatsLb: '420' });
    expect(result.current.assessment?.takeoff.violations.map((v) => v.kind)).not.toContain(
      'overMaxWeight',
    );

    act(() => {
      result.current.setCategory('utility');
    });

    expect(result.current.assessment?.takeoff.violations.map((v) => v.kind)).toContain(
      'overMaxWeight',
    );
  });

  it('clears the fields and the assessment', () => {
    const { result } = renderHook(() => useWeightBalance(TEST_AIRCRAFT));
    fill(result, WITHIN_LIMITS);

    act(() => {
      result.current.clear();
    });

    expect(result.current.assessment).toBeNull();
    expect(result.current.form.values.frontSeatsLb).toBe('');
  });

  it('keeps landing at takeoff fuel when fuel burned is left blank', () => {
    const { result } = renderHook(() => useWeightBalance(TEST_AIRCRAFT));

    fill(result, { ...WITHIN_LIMITS, fuelBurnedGallons: '' });

    expect(result.current.assessment?.takeoff.loadCase.weightLb).toBe(1200);
    expect(result.current.assessment?.landing.loadCase.weightLb).toBe(1200);
  });

  it('starts from the empty condition on record and does not flag it', () => {
    const { result } = renderHook(() => useWeightBalance(TEST_AIRCRAFT));
    fill(result, WITHIN_LIMITS);

    expect(result.current.form.values.emptyWeightLb).toBe('1000');
    expect(result.current.emptyOverridden).toBe(false);
  });

  it('uses a changed empty weight and flags it as different from the record', () => {
    const { result } = renderHook(() => useWeightBalance(TEST_AIRCRAFT));
    fill(result, { ...WITHIN_LIMITS, emptyWeightLb: '1010', emptyMomentLbIn: '40400' });

    expect(result.current.emptyOverridden).toBe(true);
    expect(result.current.assessment?.takeoff.loadCase.weightLb).toBe(1210);
    expect(result.current.assessment?.takeoff.loadCase.lines[0]?.momentLbIn).toBe(40_400);
  });

  it('puts the empty condition back on record when cleared', () => {
    const { result } = renderHook(() => useWeightBalance(TEST_AIRCRAFT));
    fill(result, { ...WITHIN_LIMITS, emptyWeightLb: '1010' });

    act(() => {
      result.current.clear();
    });

    expect(result.current.form.values.emptyWeightLb).toBe('1000');
  });
});
