import { describe, expect, it } from 'vitest';
import { createScale, tickValues } from './scale';

describe('createScale', () => {
  const scale = createScale({ min: 0, max: 10 }, 100, 200);

  it('maps the ends and the middle of the axis onto the range', () => {
    expect(scale(0)).toBe(100);
    expect(scale(5)).toBe(150);
    expect(scale(10)).toBe(200);
  });

  it('supports a reversed range, as an SVG y axis needs', () => {
    const upward = createScale({ min: 1000, max: 2000 }, 400, 0);

    expect(upward(1000)).toBe(400);
    expect(upward(1500)).toBe(200);
    expect(upward(2000)).toBe(0);
  });

  it('pins values outside the axis to its ends', () => {
    expect(scale(-5)).toBe(100);
    expect(scale(99)).toBe(200);
  });
});

describe('tickValues', () => {
  it('lists multiples of the step, ends included when they land on one', () => {
    expect(tickValues({ min: 40, max: 60 }, 5)).toEqual([40, 45, 50, 55, 60]);
  });

  it('starts at the first multiple inside the axis', () => {
    expect(tickValues({ min: 42, max: 58 }, 5)).toEqual([45, 50, 55]);
  });

  it('does not accumulate floating point error', () => {
    expect(tickValues({ min: 0, max: 1 }, 0.1)).toHaveLength(11);
  });
});
