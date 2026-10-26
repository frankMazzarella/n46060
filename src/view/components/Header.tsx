import type { Aircraft, Category } from '../../model';
import '@fontsource/barlow/latin-700.css';
import { CategoryToggle } from './CategoryToggle';
import './Header.css';

interface HeaderProps {
  readonly aircraft: Aircraft;
  readonly category: Category;
  readonly onCategoryChange: (category: Category) => void;
}

export function Header({ aircraft, category, onCategoryChange }: HeaderProps) {
  return (
    <header className="header">
      <div>
        <h1 className="header__registration">{aircraft.registration}</h1>
        <p className="header__description">{aircraft.description} · weight and balance</p>
      </div>
      <CategoryToggle value={category} onChange={onCategoryChange} />
    </header>
  );
}
