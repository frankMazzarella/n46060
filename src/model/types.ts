/**
 * Domain types for weight and balance. Units are encoded in the names:
 * `Lb` pounds, `In` inches aft of datum, `LbIn` pound-inches, `Gal` US gallons.
 */

export type Category = 'normal' | 'utility';

export const CATEGORIES = ['normal', 'utility'] as const satisfies readonly Category[];

/** A loading position. `armIn` is the effective arm: the slope of its handbook loading-graph line. */
export interface Station {
  readonly armIn: number;
}

export interface LimitedStation extends Station {
  readonly maxWeightLb: number;
}

/** One vertex of the forward CG limit, which is piecewise linear in weight. */
export interface ForwardLimitPoint {
  readonly weightLb: number;
  readonly armIn: number;
}

export interface CategoryLimits {
  readonly maxWeightLb: number;
  readonly aftLimitIn: number;
}

export interface Aircraft {
  readonly registration: string;
  readonly description: string;
  readonly emptyWeightLb: number;
  readonly emptyMomentLbIn: number;
  readonly stations: {
    readonly frontSeats: Station;
    readonly rearSeats: Station;
    readonly baggage: LimitedStation;
    readonly fuel: Station;
  };
  readonly fuel: {
    readonly usableGallons: number;
    readonly poundsPerGallon: number;
  };
  readonly categories: Readonly<Record<Category, CategoryLimits>>;
  /**
   * At least two points, ascending by weight. The limit is constant below the
   * first point and above the last, and linear in between.
   */
  readonly forwardLimit: readonly [ForwardLimitPoint, ForwardLimitPoint, ...ForwardLimitPoint[]];
}

/** What is on board at a moment in time. */
export interface LoadInputs {
  readonly frontSeatsLb: number;
  readonly rearSeatsLb: number;
  readonly baggageLb: number;
  readonly fuelGallons: number;
}

export interface FlightInputs extends LoadInputs {
  /** Fuel burned between takeoff and landing, including taxi and run-up. */
  readonly fuelBurnedGallons: number;
}

export type LoadLineId = 'empty' | 'frontSeats' | 'rearSeats' | 'baggage' | 'fuel';

export interface LoadLine {
  readonly id: LoadLineId;
  readonly weightLb: number;
  readonly armIn: number;
  readonly momentLbIn: number;
}

export interface LoadCase {
  readonly lines: readonly LoadLine[];
  readonly weightLb: number;
  readonly momentLbIn: number;
  readonly cgIn: number;
}

/** A way a load case fails its limits. Carries data only; the view words the message. */
export type Violation =
  | { readonly kind: 'overMaxWeight'; readonly excessLb: number; readonly maxWeightLb: number }
  | { readonly kind: 'forwardOfLimit'; readonly marginIn: number; readonly limitIn: number }
  | { readonly kind: 'aftOfLimit'; readonly marginIn: number; readonly limitIn: number }
  | { readonly kind: 'baggageOverMax'; readonly excessLb: number; readonly maxWeightLb: number }
  | { readonly kind: 'fuelOverUsable'; readonly excessGal: number; readonly usableGal: number }
  | { readonly kind: 'burnExceedsFuel'; readonly excessGal: number };

export interface Assessment {
  readonly loadCase: LoadCase;
  /** Empty when the load case is within all limits. */
  readonly violations: readonly Violation[];
}

export interface FlightAssessment {
  readonly takeoff: Assessment;
  readonly landing: Assessment;
}
