import { describe, expect, it } from 'vitest';
import { INITIAL_FORM_STATE } from './form';
import type { FormValues } from './form';
import { parseForm } from './parseForm';

const FILLED: FormValues = {
  frontSeatsLb: '340',
  rearSeatsLb: '0',
  baggageLb: '20',
  fuelGallons: '38',
  fuelBurnedGallons: '8',
};

describe('parseForm', () => {
  it('is ready when every field holds a quantity', () => {
    expect(parseForm(FILLED)).toEqual({
      status: 'ready',
      inputs: {
        frontSeatsLb: 340,
        rearSeatsLb: 0,
        baggageLb: 20,
        fuelGallons: 38,
        fuelBurnedGallons: 8,
      },
    });
  });

  it('is incomplete, listing the blank fields, when nothing has been entered', () => {
    expect(parseForm(INITIAL_FORM_STATE.values)).toEqual({
      status: 'incomplete',
      blank: ['frontSeatsLb', 'rearSeatsLb', 'baggageLb', 'fuelGallons', 'fuelBurnedGallons'],
    });
  });

  it('never treats a blank or whitespace-only field as zero', () => {
    expect(parseForm({ ...FILLED, rearSeatsLb: '' })).toEqual({
      status: 'incomplete',
      blank: ['rearSeatsLb'],
    });
    expect(parseForm({ ...FILLED, rearSeatsLb: '   ' })).toEqual({
      status: 'incomplete',
      blank: ['rearSeatsLb'],
    });
  });

  it.each([
    ['12', 12],
    ['12.5', 12.5],
    ['.5', 0.5],
    ['12.', 12],
    ['0', 0],
    ['007', 7],
    ['  42  ', 42],
  ])('accepts %j as %d', (text, expected) => {
    expect(parseForm({ ...FILLED, baggageLb: text })).toMatchObject({
      status: 'ready',
      inputs: { baggageLb: expected },
    });
  });

  it.each([
    ['abc'],
    ['12a'],
    ['-5'],
    ['+5'],
    ['1e3'],
    ['1,5'],
    ['1 5'],
    ['0x10'],
    ['Infinity'],
    ['NaN'],
    ['.'],
    ['1.2.3'],
    ['١٢'],
  ])('rejects %j as not a number', (text) => {
    expect(parseForm({ ...FILLED, baggageLb: text })).toEqual({
      status: 'invalid',
      issues: { baggageLb: 'notANumber' },
    });
  });

  it('reports every invalid field at once', () => {
    expect(parseForm({ ...FILLED, frontSeatsLb: 'x', fuelGallons: '-1' })).toEqual({
      status: 'invalid',
      issues: { frontSeatsLb: 'notANumber', fuelGallons: 'notANumber' },
    });
  });

  it('reports invalid text even while other fields are still blank', () => {
    expect(parseForm({ ...INITIAL_FORM_STATE.values, baggageLb: 'x' })).toEqual({
      status: 'invalid',
      issues: { baggageLb: 'notANumber' },
    });
  });

  it('rejects a number too large to be finite', () => {
    expect(parseForm({ ...FILLED, baggageLb: '9'.repeat(400) })).toEqual({
      status: 'invalid',
      issues: { baggageLb: 'notANumber' },
    });
  });
});
