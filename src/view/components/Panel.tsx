import { useId } from 'react';
import type { ReactNode } from 'react';
import './Panel.css';

interface PanelProps {
  readonly title: string;
  readonly children: ReactNode;
}

/** The one container every dashboard section uses, so edges, padding and gaps match. */
export function Panel({ title, children }: PanelProps) {
  const headingId = useId();

  return (
    <section className="panel" aria-labelledby={headingId}>
      <h2 className="panel__title" id={headingId}>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Placeholder text for a panel that has nothing to show yet. */
export function PanelMessage({ children }: { readonly children: ReactNode }) {
  return <p className="panel__message">{children}</p>;
}
