import { useId } from 'react';
import type { FieldIssue } from '../../controller';
import { describeIssue } from '../messages';
import './QuantityField.css';

interface QuantityFieldProps {
  readonly label: string;
  readonly unit: 'lb' | 'gal';
  readonly hint?: string;
  readonly value: string;
  readonly issue: FieldIssue | undefined;
  readonly onChange: (value: string) => void;
}

/** A labelled text box for one quantity, with its hint and any problem with what was typed. */
export function QuantityField({ label, unit, hint, value, issue, onChange }: QuantityFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const issueId = `${id}-issue`;
  const describedBy = [hint ? hintId : null, issue ? issueId : null].filter(Boolean).join(' ');

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label} <span className="field__unit">{unit}</span>
      </label>
      <input
        className="field__input"
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder="0"
        value={value}
        aria-invalid={issue !== undefined}
        aria-describedby={describedBy || undefined}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
      {hint ? (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {issue ? (
        <p className="field__issue" id={issueId}>
          {describeIssue(issue)}
        </p>
      ) : null}
    </div>
  );
}
