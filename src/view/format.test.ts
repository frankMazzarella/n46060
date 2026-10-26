import { describe, expect, it } from 'vitest';
import {
  formatArmIn,
  formatExcess,
  formatGallons,
  formatMomentThousands,
  formatWeightLb,
} from './format';

describe('format', () => {
  it('shows weights and gallons to one decimal with thousands separators', () => {
    expect(formatWeightLb(1980)).toBe('1,980.0');
    expect(formatWeightLb(2300.04)).toBe('2,300.0');
    expect(formatGallons(38)).toBe('38.0');
  });

  it('shows arms and moments to two decimals', () => {
    expect(formatArmIn(39.772525)).toBe('39.77');
    expect(formatMomentThousands(78_749.6)).toBe('78.75');
    expect(formatMomentThousands(53_325.6)).toBe('53.33');
  });
});

describe('formatExcess', () => {
  it('formats an amount that shows at the given precision', () => {
    expect(formatExcess(0.4, 1)).toBe('0.4');
    expect(formatExcess(120, 1)).toBe('120.0');
    expect(formatExcess(0.43, 2)).toBe('0.43');
  });

  it('never reads as zero for something that failed its check', () => {
    expect(formatExcess(0.04, 1)).toBe('less than 0.1');
    expect(formatExcess(1e-12, 1)).toBe('less than 0.1');
    expect(formatExcess(0.004, 2)).toBe('less than 0.01');
  });
});
