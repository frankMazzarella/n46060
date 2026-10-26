import { useId } from 'react';
import { CATEGORIES } from '../../model';
import type { Category } from '../../model';
import { CATEGORY_LABELS } from '../messages';
import './CategoryToggle.css';

interface CategoryToggleProps {
  readonly value: Category;
  readonly onChange: (category: Category) => void;
}

/** Radio buttons styled as a segmented control, so keyboard and screen reader behaviour is native. */
export function CategoryToggle({ value, onChange }: CategoryToggleProps) {
  const groupName = useId();

  return (
    <fieldset className="segmented">
      <legend className="visually-hidden">Operating category</legend>
      {CATEGORIES.map((category) => (
        <label key={category} className="segmented__option">
          <input
            className="segmented__input"
            type="radio"
            name={groupName}
            value={category}
            checked={value === category}
            onChange={() => {
              onChange(category);
            }}
          />
          <span className="segmented__label">{CATEGORY_LABELS[category]}</span>
        </label>
      ))}
    </fieldset>
  );
}
