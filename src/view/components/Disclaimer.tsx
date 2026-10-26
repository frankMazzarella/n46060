import './Disclaimer.css';

/**
 * TODO(V5): stays until the aircraft data has been verified against the
 * airplane's current records. See TODO.md and docs/aircraft-data.md.
 */
export function Disclaimer() {
  return (
    <aside className="disclaimer" aria-label="Limitations of this tool">
      <strong>Planning aid only.</strong> The pilot in command is responsible for the final weight
      and balance. The station arms and envelope limits were read from photographs of the handbook
      graphs and are not yet verified against the airplane&apos;s records.
    </aside>
  );
}
