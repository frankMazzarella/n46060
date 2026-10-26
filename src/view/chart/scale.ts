export interface Axis {
  readonly min: number;
  readonly max: number;
}

/**
 * Maps a value on an axis linearly onto a screen range. A value outside the
 * axis is pinned to its nearest end, so a point can never be drawn off the chart.
 */
export function createScale(
  axis: Axis,
  rangeStart: number,
  rangeEnd: number,
): (value: number) => number {
  const span = axis.max - axis.min;

  return (value) => {
    const fraction = Math.min(1, Math.max(0, (value - axis.min) / span));
    return rangeStart + fraction * (rangeEnd - rangeStart);
  };
}

/** Every multiple of `step` on the axis, both ends included when they fall on one. */
export function tickValues(axis: Axis, step: number): number[] {
  const ticks: number[] = [];
  for (let index = Math.ceil(axis.min / step); index * step <= axis.max; index += 1) {
    ticks.push(index * step);
  }
  return ticks;
}
