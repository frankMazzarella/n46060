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
});
