import type { FormField, FormState, ParsedForm } from '../../controller';
import type { Aircraft } from '../../model';
import { Panel } from './Panel';
import { QuantityField } from './QuantityField';
import './LoadForm.css';

interface FieldSpec {
  readonly field: FormField;
  readonly label: string;
  readonly unit: 'lb' | 'gal';
  readonly hint?: string;
}

function fieldSpecs(aircraft: Aircraft): readonly FieldSpec[] {
  return [
    { field: 'frontSeatsLb', label: 'Pilot and front passenger', unit: 'lb' },
    { field: 'rearSeatsLb', label: 'Rear passengers', unit: 'lb' },
    {
      field: 'baggageLb',
      label: 'Baggage',
      unit: 'lb',
      hint: `Maximum ${aircraft.stations.baggage.maxWeightLb} lb`,
    },
    {
      field: 'fuelGallons',
      label: 'Fuel loaded',
      unit: 'gal',
      hint: `${aircraft.fuel.usableGallons} gal usable`,
    },
    {
      field: 'fuelBurnedGallons',
      label: 'Fuel burned',
      unit: 'gal',
      hint: 'Taxi, run-up and flight',
    },
  ];
}

interface LoadFormProps {
  readonly aircraft: Aircraft;
  readonly values: FormState['values'];
  readonly parsed: ParsedForm;
  readonly onFieldChange: (field: FormField, value: string) => void;
  readonly onClear: () => void;
}

export function LoadForm({ aircraft, values, parsed, onFieldChange, onClear }: LoadFormProps) {
  const issues = parsed.status === 'invalid' ? parsed.issues : {};

  return (
    <Panel title="Load">
      <p className="load-form__intro">Enter every field. Use 0 for none.</p>
      {fieldSpecs(aircraft).map(({ field, label, unit, hint }) => (
        <QuantityField
          key={field}
          label={label}
          unit={unit}
          {...(hint === undefined ? {} : { hint })}
          value={values[field]}
          issue={issues[field]}
          onChange={(value) => {
            onFieldChange(field, value);
          }}
        />
      ))}
      <button className="button load-form__clear" type="button" onClick={onClear}>
        Clear all
      </button>
    </Panel>
  );
}
