import type { Category, FlightInputs } from '../model';

/** Every quantity the pilot enters. Matches the model's flight inputs one to one. */
export type FormField = keyof FlightInputs;

/** What is in each input box, exactly as typed. Parsing happens in `parseForm`. */
export type FormValues = Readonly<Record<FormField, string>>;

export interface FormState {
  readonly values: FormValues;
  readonly category: Category;
}

export type FormAction =
  | { readonly type: 'fieldChanged'; readonly field: FormField; readonly value: string }
  | { readonly type: 'categoryChanged'; readonly category: Category }
  | { readonly type: 'cleared' };

const BLANK_VALUES: FormValues = {
  frontSeatsLb: '',
  rearSeatsLb: '',
  baggageLb: '',
  fuelGallons: '',
  fuelBurnedGallons: '',
};

/**
 * Every field starts blank, not zero. The pilot has to state each quantity,
 * including "0 for none", so nothing is assumed about the load.
 */
export const INITIAL_FORM_STATE: FormState = { values: BLANK_VALUES, category: 'normal' };

export function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'fieldChanged':
      return { ...state, values: { ...state.values, [action.field]: action.value } };
    case 'categoryChanged':
      return { ...state, category: action.category };
    case 'cleared':
      // Keeps the chosen category: it describes the flight, not the load.
      return { ...state, values: BLANK_VALUES };
  }
}
