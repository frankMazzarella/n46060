import { useCallback, useMemo, useReducer } from 'react';
import { assessFlight } from '../model';
import type { Aircraft, Category, FlightAssessment } from '../model';
import { INITIAL_FORM_STATE, formReducer } from './form';
import type { FormField, FormState } from './form';
import { parseForm } from './parseForm';
import type { ParsedForm } from './parseForm';

export interface WeightBalanceController {
  readonly form: FormState;
  readonly parsed: ParsedForm;
  /** Null until every field holds a valid quantity. */
  readonly assessment: FlightAssessment | null;
  readonly setField: (field: FormField, value: string) => void;
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
  const [form, dispatch] = useReducer(formReducer, INITIAL_FORM_STATE);

  const parsed = useMemo(() => parseForm(form.values), [form.values]);

  const assessment = useMemo(
    () => (parsed.status === 'ready' ? assessFlight(aircraft, form.category, parsed.inputs) : null),
    [aircraft, form.category, parsed],
  );

  const setField = useCallback((field: FormField, value: string) => {
    dispatch({ type: 'fieldChanged', field, value });
  }, []);
  const setCategory = useCallback((category: Category) => {
    dispatch({ type: 'categoryChanged', category });
  }, []);
  const clear = useCallback(() => {
    dispatch({ type: 'cleared' });
  }, []);

  return { form, parsed, assessment, setField, setCategory, clear };
}
