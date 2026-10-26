import { forwardLimitIn } from './envelope';
import { buildLoadCase } from './loadCase';
import { assertFinite, assertQuantity } from './quantity';
import type {
  Aircraft,
  Assessment,
  Category,
  FlightAssessment,
  FlightInputs,
  LoadCase,
  LoadInputs,
  Violation,
} from './types';

/** Limits on what can physically be loaded, independent of the CG envelope. */
export function checkStationLimits(aircraft: Aircraft, inputs: LoadInputs): Violation[] {
  const violations: Violation[] = [];

  const { maxWeightLb } = aircraft.stations.baggage;
  if (inputs.baggageLb > maxWeightLb) {
    violations.push({
      kind: 'baggageOverMax',
      excessLb: inputs.baggageLb - maxWeightLb,
      maxWeightLb,
    });
  }

  const usableGal = aircraft.fuel.usableGallons;
  if (inputs.fuelGallons > usableGal) {
    violations.push({
      kind: 'fuelOverUsable',
      excessGal: inputs.fuelGallons - usableGal,
      usableGal,
    });
  }

  return violations;
}

/**
 * Checks a load case against a category's weight and CG limits. Limits are
 * inclusive and compared exactly: a load precisely on a limit passes, anything
 * beyond it fails, with no rounding tolerance in either direction.
 *
 * @throws RangeError if the load case weight is negative or not finite, or the CG is not finite.
 */
export function checkEnvelope(
  aircraft: Aircraft,
  category: Category,
  loadCase: LoadCase,
): Violation[] {
  assertQuantity('loadCase.weightLb', loadCase.weightLb);
  assertFinite('loadCase.cgIn', loadCase.cgIn);

  const violations: Violation[] = [];
  const { maxWeightLb, aftLimitIn } = aircraft.categories[category];

  if (loadCase.weightLb > maxWeightLb) {
    violations.push({
      kind: 'overMaxWeight',
      excessLb: loadCase.weightLb - maxWeightLb,
      maxWeightLb,
    });
  }

  const forwardIn = forwardLimitIn(aircraft, loadCase.weightLb);
  if (loadCase.cgIn < forwardIn) {
    violations.push({
      kind: 'forwardOfLimit',
      marginIn: forwardIn - loadCase.cgIn,
      limitIn: forwardIn,
    });
  }

  if (loadCase.cgIn > aftLimitIn) {
    violations.push({
      kind: 'aftOfLimit',
      marginIn: loadCase.cgIn - aftLimitIn,
      limitIn: aftLimitIn,
    });
  }

  return violations;
}

function assess(loadCase: LoadCase, violations: readonly Violation[]): Assessment {
  return { loadCase, violations };
}

/**
 * Assesses takeoff and landing for one flight in the chosen category.
 *
 * @throws RangeError if any input is negative or not a finite number.
 */
export function assessFlight(
  aircraft: Aircraft,
  category: Category,
  inputs: FlightInputs,
): FlightAssessment {
  assertQuantity('fuelBurnedGallons', inputs.fuelBurnedGallons);
  const takeoffCase = buildLoadCase(aircraft, inputs);

  // Landing fuel never goes below zero. Burning more than was loaded is
  // reported as its own violation rather than silently clamped.
  const landingFuelGallons = Math.max(0, inputs.fuelGallons - inputs.fuelBurnedGallons);
  const landingCase = buildLoadCase(aircraft, { ...inputs, fuelGallons: landingFuelGallons });

  const burnViolations: Violation[] =
    inputs.fuelBurnedGallons > inputs.fuelGallons
      ? [{ kind: 'burnExceedsFuel', excessGal: inputs.fuelBurnedGallons - inputs.fuelGallons }]
      : [];

  return {
    takeoff: assess(takeoffCase, [
      ...checkStationLimits(aircraft, inputs),
      ...checkEnvelope(aircraft, category, takeoffCase),
    ]),
    landing: assess(landingCase, [
      ...burnViolations,
      ...checkEnvelope(aircraft, category, landingCase),
    ]),
  };
}
