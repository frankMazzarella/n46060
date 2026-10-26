import type { FlightInputs } from '../model';
import type { FormField, FormValues } from './form';

export type FieldIssue = 'notANumber' | 'notPositive';

export type ParsedForm =
  /** Every required field holds a valid quantity. */
  | { readonly status: 'ready'; readonly inputs: FlightInputs }
  /** Nothing is wrong, but these required fields are still blank. */
  | { readonly status: 'incomplete'; readonly blank: readonly FormField[] }
  /** These fields hold text that is not an acceptable quantity. */
  | {
      readonly status: 'invalid';
      readonly issues: Readonly<Partial<Record<FormField, FieldIssue>>>;
    };

type ParsedQuantity =
  | { readonly kind: 'value'; readonly value: number }
  | { readonly kind: 'blank' }
  | { readonly kind: 'invalid'; readonly issue: FieldIssue };

/** Plain decimal digits only: "12", "12.5", ".5". No sign, exponent, comma or spaces inside. */
const QUANTITY_PATTERN = /^(?:\d+\.?\d*|\.\d+)$/;

interface FieldRule {
  /** A blank is never read as zero, except for a field that is optional. */
  readonly optional: boolean;
  /** Zero is not a usable value (empty weight is a divisor in the CG). */
  readonly mustBePositive: boolean;
}

const REQUIRED: FieldRule = { optional: false, mustBePositive: false };

const FIELD_RULES: Readonly<Record<FormField, FieldRule>> = {
  emptyWeightLb: { optional: false, mustBePositive: true },
  emptyMomentLbIn: { optional: false, mustBePositive: true },
  frontSeatsLb: REQUIRED,
  rearSeatsLb: REQUIRED,
  baggageLb: REQUIRED,
  fuelGallons: REQUIRED,
  fuelBurnedGallons: { optional: true, mustBePositive: false },
};

/** The strict reading of one typed quantity: a finite number of zero or more, or null. */
export function parseDecimal(text: string): number | null {
  const trimmed = text.trim();
  if (!QUANTITY_PATTERN.test(trimmed)) {
    return null;
  }
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

function parseQuantity(text: string, rule: FieldRule): ParsedQuantity {
  if (text.trim() === '') {
    return rule.optional ? { kind: 'value', value: 0 } : { kind: 'blank' };
  }
  const value = parseDecimal(text);
  if (value === null) {
    return { kind: 'invalid', issue: 'notANumber' };
  }
  if (rule.mustBePositive && value === 0) {
    return { kind: 'invalid', issue: 'notPositive' };
  }
  return { kind: 'value', value };
}

/**
 * Turns the typed text into model inputs, or says what is missing or wrong.
 * Strict by design: anything that is not plain decimal digits is rejected
 * rather than guessed at, and a required blank is never treated as zero.
 */
export function parseForm(values: FormValues): ParsedForm {
  const parsed: Readonly<Record<FormField, ParsedQuantity>> = {
    emptyWeightLb: parseQuantity(values.emptyWeightLb, FIELD_RULES.emptyWeightLb),
    emptyMomentLbIn: parseQuantity(values.emptyMomentLbIn, FIELD_RULES.emptyMomentLbIn),
    frontSeatsLb: parseQuantity(values.frontSeatsLb, FIELD_RULES.frontSeatsLb),
    rearSeatsLb: parseQuantity(values.rearSeatsLb, FIELD_RULES.rearSeatsLb),
    baggageLb: parseQuantity(values.baggageLb, FIELD_RULES.baggageLb),
    fuelGallons: parseQuantity(values.fuelGallons, FIELD_RULES.fuelGallons),
    fuelBurnedGallons: parseQuantity(values.fuelBurnedGallons, FIELD_RULES.fuelBurnedGallons),
  };

  const entries = Object.entries(parsed) as [FormField, ParsedQuantity][];

  const issues: Partial<Record<FormField, FieldIssue>> = {};
  for (const [field, quantity] of entries) {
    if (quantity.kind === 'invalid') {
      issues[field] = quantity.issue;
    }
  }
  if (Object.keys(issues).length > 0) {
    return { status: 'invalid', issues };
  }

  const blank = entries.filter(([, quantity]) => quantity.kind === 'blank').map(([field]) => field);
  if (blank.length > 0) {
    return { status: 'incomplete', blank };
  }

  const {
    emptyWeightLb,
    emptyMomentLbIn,
    frontSeatsLb,
    rearSeatsLb,
    baggageLb,
    fuelGallons,
    fuelBurnedGallons,
  } = parsed;
  if (
    emptyWeightLb.kind !== 'value' ||
    emptyMomentLbIn.kind !== 'value' ||
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
      emptyWeightLb: emptyWeightLb.value,
      emptyMomentLbIn: emptyMomentLbIn.value,
      frontSeatsLb: frontSeatsLb.value,
      rearSeatsLb: rearSeatsLb.value,
      baggageLb: baggageLb.value,
      fuelGallons: fuelGallons.value,
      fuelBurnedGallons: fuelBurnedGallons.value,
    },
  };
}
