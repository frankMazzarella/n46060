import type { Aircraft, Category, FlightInputs } from '../model';
import { parseDecimal } from './parseForm';

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
  /**
   * The slider moved the empty weight. The moment is estimated by keeping the
   * empty CG arm: the one the boxes currently give, or `fallbackArmIn` when they
   * do not hold a usable weight and moment.
   */
  | {
      readonly type: 'emptyWeightSlid';
      readonly weightLb: number;
      readonly fallbackArmIn: number;
    }
  /** Puts every field back to `values`, normally the aircraft's starting values. */
  | { readonly type: 'cleared'; readonly values: FormValues };

/**
 * The load fields start blank, not zero. The pilot has to state each quantity,
 * including "0 for none", so nothing is assumed about the load. The empty
 * condition starts at the aircraft's weighed values, because it is a property
 * of the airplane and not of the flight. Fuel burned is optional: blank means none.
 */
export function initialFormState(aircraft: Aircraft): FormState {
  return {
    category: 'normal',
    values: {
      emptyWeightLb: String(aircraft.emptyWeightLb),
      emptyMomentLbIn: String(aircraft.emptyMomentLbIn),
      frontSeatsLb: '',
      rearSeatsLb: '',
      baggageLb: '',
      fuelGallons: '',
      fuelBurnedGallons: '',
    },
  };
}

export function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'fieldChanged':
      return { ...state, values: { ...state.values, [action.field]: action.value } };
    case 'categoryChanged':
      return { ...state, category: action.category };
    case 'emptyWeightSlid': {
      const weightLb = parseDecimal(state.values.emptyWeightLb);
      const momentLbIn = parseDecimal(state.values.emptyMomentLbIn);
      const armIn =
        weightLb !== null && momentLbIn !== null && weightLb > 0 && momentLbIn > 0
          ? momentLbIn / weightLb
          : action.fallbackArmIn;
      return {
        ...state,
        values: {
          ...state.values,
          emptyWeightLb: String(action.weightLb),
          // Two decimals keeps the arm within a millionth of an inch of where it was.
          emptyMomentLbIn: String(Number((action.weightLb * armIn).toFixed(2))),
        },
      };
    }
    case 'cleared':
      // Keeps the chosen category: it describes the flight, not the load.
      return { ...state, values: action.values };
  }
}
