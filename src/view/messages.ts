import type { FieldIssue, ParsedForm } from '../controller';
import type { Category, Violation } from '../model';
import { formatArmIn, formatExcess, formatGallons, formatWeightLb } from './format';

/** Every sentence the pilot reads about a problem lives here. */

export const CATEGORY_LABELS: Readonly<Record<Category, string>> = {
  normal: 'Normal',
  utility: 'Utility',
};

const ISSUE_MESSAGES: Readonly<Record<FieldIssue, string>> = {
  notANumber: 'Enter a number such as 12 or 12.5.',
};

export function describeIssue(issue: FieldIssue): string {
  return ISSUE_MESSAGES[issue];
}

export function describeViolation(violation: Violation): string {
  switch (violation.kind) {
    case 'overMaxWeight':
      return `Weight is ${formatExcess(violation.excessLb, 1)} lb over the ${formatWeightLb(violation.maxWeightLb)} lb maximum.`;
    case 'forwardOfLimit':
      return `CG is ${formatExcess(violation.marginIn, 2)} in forward of the ${formatArmIn(violation.limitIn)} in limit.`;
    case 'aftOfLimit':
      return `CG is ${formatExcess(violation.marginIn, 2)} in aft of the ${formatArmIn(violation.limitIn)} in limit.`;
    case 'baggageOverMax':
      return `Baggage is ${formatExcess(violation.excessLb, 1)} lb over the ${formatWeightLb(violation.maxWeightLb)} lb limit.`;
    case 'fuelOverUsable':
      return `Fuel is ${formatExcess(violation.excessGal, 1)} gal over the ${formatGallons(violation.usableGal)} gal usable.`;
    case 'burnExceedsFuel':
      return `Fuel burned is ${formatExcess(violation.excessGal, 1)} gal more than the fuel loaded.`;
  }
}

/** What to show in place of results while the form cannot be assessed. */
export function describePending(parsed: Exclude<ParsedForm, { status: 'ready' }>): string {
  switch (parsed.status) {
    case 'incomplete':
      return 'Enter a value in every field to see results. Use 0 for none.';
    case 'invalid':
      return 'Fix the highlighted fields to see results.';
  }
}
