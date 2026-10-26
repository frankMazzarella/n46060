import { useCallback, useMemo, useReducer } from 'react';
import { assessFlight } from '../model';
import type { Aircraft, Category, FlightAssessment } from '../model';
import { formReducer, initialFormState } from './form';
import type { FormField, FormState } from './form';
import { parseForm } from './parseForm';
import type { ParsedForm } from './parseForm';

export interface WeightBalanceController {
  readonly form: FormState;
  readonly parsed: ParsedForm;
  /** Null until every required field holds a valid quantity. */
  readonly assessment: FlightAssessment | null;
  /** True when the empty weight or moment in use differs from the aircraft's weighed record. */
  readonly emptyOverridden: boolean;
  readonly setField: (field: FormField, value: string) => void;
  /** Sets the empty weight from the slider and estimates the moment at the same empty CG. */
  readonly slideEmptyWeight: (weightLb: number) => void;
  readonly setCategory: (category: Category) => void;
  readonly clear: () => void;
}

/**
 * Connects the form to the model: keeps what the pilot typed, parses it, and
 * assesses the flight whenever it is complete. Holds no weight and balance
 * rules of its own, and keeps nothing between page loads, so a loading from a
 * previous flight can never be mistaken for the current one.
 */
export function useWeightBalance(aircraft: Aircraft): WeightBalanceController {
  const [form, dispatch] = useReducer(formReducer, aircraft, initialFormState);

  const parsed = useMemo(() => parseForm(form.values), [form.values]);

  const assessment = useMemo(
    () => (parsed.status === 'ready' ? assessFlight(aircraft, form.category, parsed.inputs) : null),
    [aircraft, form.category, parsed],
  );

  const emptyOverridden =
    parsed.status === 'ready' &&
    (parsed.inputs.emptyWeightLb !== aircraft.emptyWeightLb ||
      parsed.inputs.emptyMomentLbIn !== aircraft.emptyMomentLbIn);

  const setField = useCallback((field: FormField, value: string) => {
    dispatch({ type: 'fieldChanged', field, value });
  }, []);
  const slideEmptyWeight = useCallback(
    (weightLb: number) => {
      dispatch({
        type: 'emptyWeightSlid',
        weightLb,
        fallbackArmIn: aircraft.emptyMomentLbIn / aircraft.emptyWeightLb,
      });
    },
    [aircraft],
  );
  const setCategory = useCallback((category: Category) => {
    dispatch({ type: 'categoryChanged', category });
  }, []);
  const clear = useCallback(() => {
    dispatch({ type: 'cleared', values: initialFormState(aircraft).values });
  }, [aircraft]);

  return {
    form,
    parsed,
    assessment,
    emptyOverridden,
    setField,
    slideEmptyWeight,
    setCategory,
    clear,
  };
}
