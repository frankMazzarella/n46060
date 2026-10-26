import type { Aircraft, Category } from './types';

/** The handbook plots moment divided by 1000. */
export function toMomentThousands(momentLbIn: number): number {
  return momentLbIn / 1000;
}

export interface EnvelopePoint {
  readonly momentThousandsLbIn: number;
  readonly weightLb: number;
}

/**
 * Forward CG limit in inches aft of datum at a given weight. Linear between
 * the aircraft's forward-limit points, held constant outside them.
 *
 * TODO(V4): this interpolates in arm. The handbook chart draws a straight line
 * in moment space, which is stricter by up to 0.144 in near 2,120 lb for
 * N46060. Decide which is authoritative.
 */
export function forwardLimitIn(aircraft: Aircraft, weightLb: number): number {
  const [first, ...rest] = aircraft.forwardLimit;
  if (weightLb <= first.weightLb) {
    return first.armIn;
  }

  let previous = first;
  for (const point of rest) {
    if (weightLb <= point.weightLb) {
      const fraction = (weightLb - previous.weightLb) / (point.weightLb - previous.weightLb);
      return previous.armIn + fraction * (point.armIn - previous.armIn);
    }
    previous = point;
  }
  return previous.armIn;
}

function envelopePoint(armIn: number, weightLb: number): EnvelopePoint {
  return { momentThousandsLbIn: toMomentThousands(armIn * weightLb), weightLb };
}

/**
 * Vertices of a category's envelope in (moment/1000, weight) space, running up
 * the forward limit and back down the aft limit. The shape is extended down to
 * `floorWeightLb` at the same arms, because the handbook chart stops at 1500 lb.
 */
export function envelopeOutline(
  aircraft: Aircraft,
  category: Category,
  floorWeightLb: number,
): readonly EnvelopePoint[] {
  const { maxWeightLb, aftLimitIn } = aircraft.categories[category];

  const bendWeights = aircraft.forwardLimit
    .map((point) => point.weightLb)
    .filter((weightLb) => weightLb > floorWeightLb && weightLb < maxWeightLb);
  const forwardWeights = [floorWeightLb, ...bendWeights, maxWeightLb];

  return [
    ...forwardWeights.map((weightLb) =>
      envelopePoint(forwardLimitIn(aircraft, weightLb), weightLb),
    ),
    envelopePoint(aftLimitIn, maxWeightLb),
    envelopePoint(aftLimitIn, floorWeightLb),
  ];
}
