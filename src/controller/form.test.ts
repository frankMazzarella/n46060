import { describe, expect, it } from 'vitest';
import { TEST_AIRCRAFT } from '../test/fixtures';
import { formReducer, initialFormState } from './form';

const INITIAL_FORM_STATE = initialFormState(TEST_AIRCRAFT);

describe('formReducer', () => {
  it('starts with the load blank, the empty condition on record and the normal category', () => {
    expect(INITIAL_FORM_STATE.values).toEqual({
      emptyWeightLb: '1000',
      emptyMomentLbIn: '40000',
      frontSeatsLb: '',
      rearSeatsLb: '',
      baggageLb: '',
      fuelGallons: '',
      fuelBurnedGallons: '',
    });
    expect(INITIAL_FORM_STATE.category).toBe('normal');
  });

  it('changes one field and leaves the others alone', () => {
    const next = formReducer(INITIAL_FORM_STATE, {
      type: 'fieldChanged',
      field: 'baggageLb',
      value: '20',
    });

    expect(next.values).toEqual({ ...INITIAL_FORM_STATE.values, baggageLb: '20' });
    expect(INITIAL_FORM_STATE.values.baggageLb).toBe('');
  });

  it('changes the category and keeps the typed values', () => {
    const typed = formReducer(INITIAL_FORM_STATE, {
      type: 'fieldChanged',
      field: 'frontSeatsLb',
      value: '170',
    });
    const next = formReducer(typed, { type: 'categoryChanged', category: 'utility' });

    expect(next.category).toBe('utility');
    expect(next.values.frontSeatsLb).toBe('170');
  });

  it('puts every field back to its starting value but keeps the category', () => {
    const typed = formReducer(
      formReducer(INITIAL_FORM_STATE, { type: 'categoryChanged', category: 'utility' }),
      { type: 'fieldChanged', field: 'frontSeatsLb', value: '170' },
    );
    const edited = formReducer(typed, {
      type: 'fieldChanged',
      field: 'emptyWeightLb',
      value: '1010',
    });
    const next = formReducer(edited, { type: 'cleared', values: INITIAL_FORM_STATE.values });

    expect(next.values).toEqual(INITIAL_FORM_STATE.values);
    expect(next.category).toBe('utility');
  });

  describe('emptyWeightSlid', () => {
    // The fixture empty arm is 40 in (40,000 / 1000).
    const slide = (state: ReturnType<typeof initialFormState>, weightLb: number) =>
      formReducer(state, { type: 'emptyWeightSlid', weightLb, fallbackArmIn: 40 });

    it('moves the weight and keeps the empty arm, so the moment follows', () => {
      const next = slide(INITIAL_FORM_STATE, 1010);

      expect(next.values.emptyWeightLb).toBe('1010');
      expect(next.values.emptyMomentLbIn).toBe('40400');
    });

    it('keeps the arm of a moment the pilot typed, not the arm on record', () => {
      // 1000 lb at 41,000 lb-in is a 41 in arm.
      const typed = formReducer(INITIAL_FORM_STATE, {
        type: 'fieldChanged',
        field: 'emptyMomentLbIn',
        value: '41000',
      });

      expect(slide(typed, 1100).values.emptyMomentLbIn).toBe('45100');
    });

    it.each([
      ['emptyWeightLb', ''],
      ['emptyWeightLb', 'abc'],
      ['emptyWeightLb', '0'],
      ['emptyMomentLbIn', ''],
      ['emptyMomentLbIn', '1e3'],
    ] as const)('falls back to the record arm when %s is %j', (field, value) => {
      const broken = formReducer(INITIAL_FORM_STATE, { type: 'fieldChanged', field, value });

      expect(slide(broken, 1010).values.emptyMomentLbIn).toBe('40400');
    });

    it('does not drift when the slider is dragged back and forth', () => {
      let state = INITIAL_FORM_STATE;
      for (const weightLb of [1013, 1007, 1031, 999, 1043, 1000]) {
        state = slide(state, weightLb);
      }

      expect(state.values.emptyMomentLbIn).toBe('40000');
    });

    it('leaves the load fields and category alone', () => {
      const typed = formReducer(INITIAL_FORM_STATE, {
        type: 'fieldChanged',
        field: 'baggageLb',
        value: '20',
      });

      expect(slide(typed, 1010).values.baggageLb).toBe('20');
    });
  });
});
