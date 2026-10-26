import { useId } from 'react';
import type { FieldIssue, FormField, FormState } from '../../controller';
import type { Aircraft } from '../../model';
import { formatMomentLbIn, formatWeightLb } from '../format';
import { QuantityField } from './QuantityField';
import './EmptyAirplane.css';

/** Slider range around the weighed value. The number box accepts anything positive. */
const SLIDER_SPAN_LB = 100;

interface EmptyAirplaneProps {
  readonly aircraft: Aircraft;
  readonly values: FormState['values'];
  readonly issues: Readonly<Partial<Record<FormField, FieldIssue>>>;
  readonly onFieldChange: (field: FormField, value: string) => void;
  readonly onSlide: (weightLb: number) => void;
}

/**
 * The empty weight and moment, which change after each weighing. They start at
 * the values on record. The slider is a quick estimate: it moves the weight and
 * keeps the empty CG, so the moment follows. The boxes take exact figures, and a
 * weight typed on its own leaves the moment alone.
 */
export function EmptyAirplane({
  aircraft,
  values,
  issues,
  onFieldChange,
  onSlide,
}: EmptyAirplaneProps) {
  const sliderId = useId();
  const min = aircraft.emptyWeightLb - SLIDER_SPAN_LB;
  const max = aircraft.emptyWeightLb + SLIDER_SPAN_LB;
  const typedWeightLb = Number(values.emptyWeightLb);
  // A blank or invalid box parks the slider on the record value. Only the boxes decide the input.
  const sliderValue =
    values.emptyWeightLb.trim() !== '' && Number.isFinite(typedWeightLb)
      ? Math.min(max, Math.max(min, typedWeightLb))
      : aircraft.emptyWeightLb;

  return (
    <fieldset className="empty-airplane">
      <legend className="empty-airplane__legend">Empty airplane</legend>
      <p className="empty-airplane__hint">
        On record: {formatWeightLb(aircraft.emptyWeightLb)} lb,{' '}
        {formatMomentLbIn(aircraft.emptyMomentLbIn)} lb-in. The slider estimates the moment at the
        same empty CG. Type both boxes for figures from a new weighing.
      </p>
      <input
        className="empty-airplane__slider"
        id={sliderId}
        type="range"
        min={min}
        max={max}
        step={1}
        value={sliderValue}
        aria-label="Slider for empty weight"
        onChange={(event) => {
          onSlide(event.target.valueAsNumber);
        }}
      />
      <QuantityField
        label="Empty weight"
        unit="lb"
        value={values.emptyWeightLb}
        issue={issues.emptyWeightLb}
        onChange={(value) => {
          onFieldChange('emptyWeightLb', value);
        }}
      />
      <QuantityField
        label="Empty moment"
        unit="lb-in"
        value={values.emptyMomentLbIn}
        issue={issues.emptyMomentLbIn}
        onChange={(value) => {
          onFieldChange('emptyMomentLbIn', value);
        }}
      />
      <button
        className="button empty-airplane__reset"
        type="button"
        onClick={() => {
          onFieldChange('emptyWeightLb', String(aircraft.emptyWeightLb));
          onFieldChange('emptyMomentLbIn', String(aircraft.emptyMomentLbIn));
        }}
      >
        Reset to record
      </button>
    </fieldset>
  );
}
