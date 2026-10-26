/** Number formatting for display. Every figure on screen goes through here. */

function formatter(fractionDigits: number): Intl.NumberFormat {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

const ONE_DECIMAL = formatter(1);
const TWO_DECIMALS = formatter(2);

export function formatWeightLb(weightLb: number): string {
  return ONE_DECIMAL.format(weightLb);
}

export function formatMomentLbIn(momentLbIn: number): string {
  return ONE_DECIMAL.format(momentLbIn);
}

export function formatGallons(gallons: number): string {
  return ONE_DECIMAL.format(gallons);
}

export function formatArmIn(armIn: number): string {
  return TWO_DECIMALS.format(armIn);
}

/** The handbook plots and tabulates moment divided by 1000. */
export function formatMomentThousands(momentLbIn: number): string {
  return TWO_DECIMALS.format(momentLbIn / 1000);
}

/**
 * Formats how far past a limit something is. A value too small to show at the
 * given precision reads "less than 0.1" instead of "0.0", so a figure that
 * failed its check never looks like it was exactly on the limit.
 */
export function formatExcess(excess: number, decimals: 1 | 2): string {
  const smallest = 10 ** -decimals;
  if (excess < smallest / 2) {
    return `less than ${smallest.toFixed(decimals)}`;
  }
  return (decimals === 1 ? ONE_DECIMAL : TWO_DECIMALS).format(excess);
}
