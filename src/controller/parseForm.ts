import type { FlightInputs } from '../model';
import type { FormField, FormValues } from './form';

export type FieldIssue = 'notANumber';

export type ParsedForm =
  /** Every field holds a valid quantity. */
  | { readonly status: 'ready'; readonly inputs: FlightInputs }
  /** Nothing is wrong, but these fields are still blank. */
  | { readonly status: 'incomplete'; readonly blank: readonly FormField[] }
  /** These fields hold text that is not a quantity. */
  | {
      readonly status: 'invalid';
      readonly issues: Readonly<Partial<Record<FormField, FieldIssue>>>;
    };

type ParsedQuantity =
  | { readonly kind: 'value'; readonly value: number }
  | { readonly kind: 'blank' }
  | { readonly kind: 'invalid' };

/** Plain decimal digits only: "12", "12.5", ".5". No sign, exponent, comma or spaces inside. */
const QUANTITY_PATTERN = /^(?:\d+\.?\d*|\.\d+)$/;

function parseQuantity(text: string): ParsedQuantity {
  const trimmed = text.trim();
  if (trimmed === '') {
    return { kind: 'blank' };
  }
  if (!QUANTITY_PATTERN.test(trimmed)) {
    return { kind: 'invalid' };
  }
  const value = Number(trimmed);
  return Number.isFinite(value) ? { kind: 'value', value } : { kind: 'invalid' };
}

/**
 * Turns the typed text into model inputs, or says what is missing or wrong.
 * Strict by design: anything that is not plain decimal digits is rejected
 * rather than guessed at, and a blank is never treated as zero.
 */
export function parseForm(values: FormValues): ParsedForm {
  const parsed: Readonly<Record<FormField, ParsedQuantity>> = {
    frontSeatsLb: parseQuantity(values.frontSeatsLb),
    rearSeatsLb: parseQuantity(values.rearSeatsLb),
    baggageLb: parseQuantity(values.baggageLb),
    fuelGallons: parseQuantity(values.fuelGallons),
    fuelBurnedGallons: parseQuantity(values.fuelBurnedGallons),
  };

  const entries = Object.entries(parsed) as [FormField, ParsedQuantity][];

  const issues: Partial<Record<FormField, FieldIssue>> = {};
  for (const [field, quantity] of entries) {
    if (quantity.kind === 'invalid') {
      issues[field] = 'notANumber';
    }
  }
  if (Object.keys(issues).length > 0) {
    return { status: 'invalid', issues };
  }

  const blank = entries.filter(([, quantity]) => quantity.kind === 'blank').map(([field]) => field);
  if (blank.length > 0) {
    return { status: 'incomplete', blank };
  }

  const { frontSeatsLb, rearSeatsLb, baggageLb, fuelGallons, fuelBurnedGallons } = parsed;
  if (
    frontSeatsLb.kind !== 'value' ||
    rearSeatsLb.kind !== 'value' ||
    baggageLb.kind !== 'value' ||
    fuelGallons.kind !== 'value' ||
    fuelBurnedGallons.kind !== 'value'
  ) {
    // Unreachable: every non-value case returned above. Kept so the compiler
    // narrows the fields and a future change cannot slip a non-value through.
    throw new Error('parseForm: unexpected non-value after validation');
  }

  return {
    status: 'ready',
    inputs: {
      frontSeatsLb: frontSeatsLb.value,
      rearSeatsLb: rearSeatsLb.value,
      baggageLb: baggageLb.value,
      fuelGallons: fuelGallons.value,
      fuelBurnedGallons: fuelBurnedGallons.value,
    },
  };
}
