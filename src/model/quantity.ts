/**
 * Guards for numbers entering the calculation. NaN fails every `<` and `>`
 * comparison, so without these a corrupt value would pass each limit check and
 * report a result that looks valid. Fail loudly instead.
 */

/** Throws unless `value` is a finite number of zero or more. */
export function assertQuantity(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite number of zero or more, got ${value}`);
  }
}

/** Throws unless `value` is a finite number greater than zero. */
export function assertPositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a finite number above zero, got ${value}`);
  }
}

/** Throws unless `value` is a finite number. */
export function assertFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number, got ${value}`);
  }
}
