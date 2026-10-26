import { assertQuantity } from './quantity';
import type { Aircraft, LoadCase, LoadInputs, LoadLine, LoadLineId } from './types';

function stationLine(id: LoadLineId, weightLb: number, armIn: number): LoadLine {
  return { id, weightLb, armIn, momentLbIn: weightLb * armIn };
}

function sum(lines: readonly LoadLine[], pick: (line: LoadLine) => number): number {
  return lines.reduce((total, line) => total + pick(line), 0);
}

/**
 * Totals the empty airplane plus everything on board into a weight, moment and CG.
 *
 * @throws RangeError if any input is negative or not a finite number.
 */
export function buildLoadCase(aircraft: Aircraft, inputs: LoadInputs): LoadCase {
  assertQuantity('frontSeatsLb', inputs.frontSeatsLb);
  assertQuantity('rearSeatsLb', inputs.rearSeatsLb);
  assertQuantity('baggageLb', inputs.baggageLb);
  assertQuantity('fuelGallons', inputs.fuelGallons);

  const { stations, fuel } = aircraft;

  const lines: readonly LoadLine[] = [
    {
      id: 'empty',
      weightLb: aircraft.emptyWeightLb,
      armIn: aircraft.emptyMomentLbIn / aircraft.emptyWeightLb,
      momentLbIn: aircraft.emptyMomentLbIn,
    },
    stationLine('frontSeats', inputs.frontSeatsLb, stations.frontSeats.armIn),
    stationLine('rearSeats', inputs.rearSeatsLb, stations.rearSeats.armIn),
    stationLine('baggage', inputs.baggageLb, stations.baggage.armIn),
    stationLine('fuel', inputs.fuelGallons * fuel.poundsPerGallon, stations.fuel.armIn),
  ];

  const weightLb = sum(lines, (line) => line.weightLb);
  const momentLbIn = sum(lines, (line) => line.momentLbIn);

  return { lines, weightLb, momentLbIn, cgIn: momentLbIn / weightLb };
}
