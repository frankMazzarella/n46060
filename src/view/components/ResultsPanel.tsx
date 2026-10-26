import type { Assessment, Category, FlightAssessment } from '../../model';
import { formatArmIn, formatMomentThousands, formatWeightLb } from '../format';
import { CATEGORY_LABELS, describeViolation } from '../messages';
import { Panel, PanelMessage } from './Panel';
import './ResultsPanel.css';

interface PhaseResultProps {
  readonly title: string;
  readonly assessment: Assessment;
}

function PhaseResult({ title, assessment }: PhaseResultProps) {
  const { loadCase, violations } = assessment;
  const withinLimits = violations.length === 0;

  return (
    <article className="phase">
      <header className="phase__header">
        <h3 className="phase__title">{title}</h3>
        <span className={`status status--${withinLimits ? 'ok' : 'danger'}`}>
          {withinLimits ? 'Within limits' : 'Out of limits'}
        </span>
      </header>
      <dl className="phase__figures">
        <div className="phase__figure">
          <dt>Weight</dt>
          <dd>{formatWeightLb(loadCase.weightLb)} lb</dd>
        </div>
        <div className="phase__figure">
          <dt>CG</dt>
          <dd>{formatArmIn(loadCase.cgIn)} in</dd>
        </div>
        <div className="phase__figure">
          <dt>Moment ÷ 1000</dt>
          <dd>{formatMomentThousands(loadCase.momentLbIn)}</dd>
        </div>
      </dl>
      {withinLimits ? null : (
        <ul className="phase__violations">
          {violations.map((violation) => (
            <li key={violation.kind}>{describeViolation(violation)}</li>
          ))}
        </ul>
      )}
    </article>
  );
}

interface ResultsPanelProps {
  readonly category: Category;
  readonly assessment: FlightAssessment | null;
  /** Shown instead of results while the form cannot be assessed. */
  readonly pendingMessage: string | null;
}

export function ResultsPanel({ category, assessment, pendingMessage }: ResultsPanelProps) {
  return (
    <Panel title="Result">
      <p className="results__basis">
        Checked against {CATEGORY_LABELS[category].toLowerCase()} category limits.
      </p>
      <div className="results" aria-live="polite">
        {assessment ? (
          <>
            <PhaseResult title="Takeoff" assessment={assessment.takeoff} />
            <PhaseResult title="Landing" assessment={assessment.landing} />
          </>
        ) : (
          <PanelMessage>{pendingMessage}</PanelMessage>
        )}
      </div>
    </Panel>
  );
}
