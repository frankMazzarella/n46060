import { describe, expect, it } from 'vitest';
import { INITIAL_FORM_STATE, formReducer } from './form';

describe('formReducer', () => {
  it('starts with every field blank and the normal category', () => {
    expect(Object.values(INITIAL_FORM_STATE.values)).toEqual(['', '', '', '', '']);
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

  it('clears every field but keeps the category', () => {
    const typed = formReducer(
      formReducer(INITIAL_FORM_STATE, { type: 'categoryChanged', category: 'utility' }),
      { type: 'fieldChanged', field: 'frontSeatsLb', value: '170' },
    );
    const next = formReducer(typed, { type: 'cleared' });

    expect(next.values).toEqual(INITIAL_FORM_STATE.values);
    expect(next.category).toBe('utility');
  });
});
