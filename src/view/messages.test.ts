import { describe, expect, it } from 'vitest';
import type { Violation } from '../model';
import { describeIssue, describePending, describeViolation } from './messages';

describe('describeViolation', () => {
  const cases: readonly (readonly [Violation, string])[] = [
    [
      { kind: 'overMaxWeight', excessLb: 120, maxWeightLb: 2300 },
      'Weight is 120.0 lb over the 2,300.0 lb maximum.',
    ],
    [
      { kind: 'forwardOfLimit', marginIn: 0.4286, limitIn: 34 },
      'CG is 0.43 in forward of the 34.00 in limit.',
    ],
    [
      { kind: 'aftOfLimit', marginIn: 1.5, limitIn: 47.3 },
      'CG is 1.50 in aft of the 47.30 in limit.',
    ],
    [
      { kind: 'baggageOverMax', excessLb: 30, maxWeightLb: 120 },
      'Baggage is 30.0 lb over the 120.0 lb limit.',
    ],
    [
      { kind: 'fuelOverUsable', excessGal: 2, usableGal: 38 },
      'Fuel is 2.0 gal over the 38.0 gal usable.',
    ],
    [
      { kind: 'burnExceedsFuel', excessGal: 3 },
      'Fuel burned is 3.0 gal more than the fuel loaded.',
    ],
  ];

  it.each(cases)('words %j', (violation, expected) => {
    expect(describeViolation(violation)).toBe(expected);
  });

  it('does not round a failing margin down to nothing', () => {
    expect(describeViolation({ kind: 'aftOfLimit', marginIn: 0.001, limitIn: 47.3 })).toBe(
      'CG is less than 0.01 in aft of the 47.30 in limit.',
    );
  });
});

describe('describeIssue and describePending', () => {
  it('explains what a valid quantity looks like', () => {
    expect(describeIssue('notANumber')).toBe('Enter a number such as 12 or 12.5.');
  });

  it('says what is needed while results are unavailable', () => {
    expect(describePending({ status: 'incomplete', blank: ['baggageLb'] })).toContain('Use 0');
    expect(describePending({ status: 'invalid', issues: { baggageLb: 'notANumber' } })).toContain(
      'Fix the highlighted fields',
    );
  });
});
