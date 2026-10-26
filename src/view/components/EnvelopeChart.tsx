import { useId } from 'react';
import { CATEGORIES, envelopeOutline, toMomentThousands } from '../../model';
import type { Aircraft, Assessment, Category, FlightAssessment, LoadCase } from '../../model';
import { createScale, tickValues } from '../chart/scale';
import type { Axis } from '../chart/scale';
import { formatMomentThousands, formatWeightLb } from '../format';
import { CATEGORY_LABELS } from '../messages';
import { Panel } from './Panel';
import './EnvelopeChart.css';

// TODO(V6): the chart's drawing and marker placement have no automated test
// beyond the scale helpers. They were checked by eye in Chromium only.
const VIEW_WIDTH = 480;
const VIEW_HEIGHT = 400;
const MARGIN = { top: 16, right: 12, bottom: 52, left: 60 } as const;

const MOMENT_AXIS: Axis = { min: 40, max: 115 };
const WEIGHT_AXIS: Axis = { min: 1300, max: 2400 };
const MOMENT_TICK_STEP = 5;
const WEIGHT_TICK_STEP = 100;
const LABEL_EVERY = 2;

/** The handbook chart starts at 1500 lb; the outline is drawn from there. */
const OUTLINE_FLOOR_LB = 1500;

const MARKER_RADIUS = 7;
const LABEL_GAP_ABOVE = 12;
const LABEL_GAP_BELOW = 26;
/** Keeps marker labels inside the drawing, even for a point pinned to an edge. */
const LABEL_MIN_Y = MARGIN.top + 14;
const LABEL_MAX_Y = VIEW_HEIGHT - MARGIN.bottom - 6;
/** Room a label needs beside its marker before it is flipped to the marker's left. */
const LABEL_ROOM = 110;

const scaleX = createScale(MOMENT_AXIS, MARGIN.left, VIEW_WIDTH - MARGIN.right);
const scaleY = createScale(WEIGHT_AXIS, VIEW_HEIGHT - MARGIN.bottom, MARGIN.top);

/**
 * True when a load case falls outside the chart's axes. Such a point is pinned
 * to the nearest edge, so it is labelled "off chart" rather than left to look
 * like a reading taken at the edge.
 */
function isOffChart({ momentLbIn, weightLb }: LoadCase): boolean {
  const momentThousands = toMomentThousands(momentLbIn);
  return (
    momentThousands < MOMENT_AXIS.min ||
    momentThousands > MOMENT_AXIS.max ||
    weightLb < WEIGHT_AXIS.min ||
    weightLb > WEIGHT_AXIS.max
  );
}

interface MarkerProps {
  readonly name: string;
  readonly assessment: Assessment;
  /** Which side of the marker the label goes, so takeoff and landing labels do not collide. */
  readonly labelAbove: boolean;
}

/** A circle when within limits, a diamond when not, so the state never depends on colour alone. */
function Marker({ name, assessment, labelAbove }: MarkerProps) {
  const { loadCase, violations } = assessment;
  const withinLimits = violations.length === 0;
  const x = scaleX(toMomentThousands(loadCase.momentLbIn));
  const y = scaleY(loadCase.weightLb);
  const labelOnLeft = x > VIEW_WIDTH - MARGIN.right - LABEL_ROOM;
  const labelY = labelAbove ? y - LABEL_GAP_ABOVE : y + LABEL_GAP_BELOW;

  return (
    <g className={`chart__marker chart__marker--${withinLimits ? 'ok' : 'danger'}`}>
      {withinLimits ? (
        <circle cx={x} cy={y} r={MARKER_RADIUS} />
      ) : (
        <rect
          x={x - MARKER_RADIUS}
          y={y - MARKER_RADIUS}
          width={MARKER_RADIUS * 2}
          height={MARKER_RADIUS * 2}
          transform={`rotate(45 ${x} ${y})`}
        />
      )}
      <text
        className="chart__marker-label"
        x={labelOnLeft ? x - LABEL_GAP_ABOVE : x + LABEL_GAP_ABOVE}
        y={Math.min(LABEL_MAX_Y, Math.max(LABEL_MIN_Y, labelY))}
        textAnchor={labelOnLeft ? 'end' : 'start'}
      >
        {isOffChart(loadCase) ? `${name}, off chart` : name}
      </text>
    </g>
  );
}

function describeChart(assessment: FlightAssessment | null): string {
  if (!assessment) {
    return 'No loading entered yet. Only the category envelopes are drawn.';
  }
  const describe = (name: string, { loadCase, violations }: Assessment) =>
    `${name}: ${formatWeightLb(loadCase.weightLb)} lb at moment ${formatMomentThousands(loadCase.momentLbIn)}, ${violations.length === 0 ? 'within limits' : 'out of limits'}${isOffChart(loadCase) ? ', off the chart' : ''}.`;

  return `${describe('Takeoff', assessment.takeoff)} ${describe('Landing', assessment.landing)}`;
}

interface EnvelopeChartProps {
  readonly aircraft: Aircraft;
  readonly category: Category;
  readonly assessment: FlightAssessment | null;
}

/** Weight against moment ÷ 1000, laid out like the handbook's CG moment envelope. */
export function EnvelopeChart({ aircraft, category, assessment }: EnvelopeChartProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;

  const momentTicks = tickValues(MOMENT_AXIS, MOMENT_TICK_STEP);
  const weightTicks = tickValues(WEIGHT_AXIS, WEIGHT_TICK_STEP);
  const plotLeft = MARGIN.left;
  const plotRight = VIEW_WIDTH - MARGIN.right;
  const plotTop = MARGIN.top;
  const plotBottom = VIEW_HEIGHT - MARGIN.bottom;

  // Draw the selected category last so it sits on top of the other.
  const drawOrder = [...CATEGORIES].sort((a, b) => Number(a === category) - Number(b === category));

  return (
    <Panel title="CG moment envelope">
      <svg
        className="chart"
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
      >
        <title id={titleId}>Center of gravity moment envelope, weight against moment</title>
        <desc id={descId}>{describeChart(assessment)}</desc>

        {momentTicks.map((tick, index) => (
          <g key={`x${tick}`}>
            <line
              className="chart__grid"
              x1={scaleX(tick)}
              x2={scaleX(tick)}
              y1={plotTop}
              y2={plotBottom}
            />
            {index % LABEL_EVERY === 0 ? (
              <text
                className="chart__tick"
                x={scaleX(tick)}
                y={plotBottom + 18}
                textAnchor="middle"
              >
                {tick}
              </text>
            ) : null}
          </g>
        ))}
        {weightTicks.map((tick, index) => (
          <g key={`y${tick}`}>
            <line
              className="chart__grid"
              x1={plotLeft}
              x2={plotRight}
              y1={scaleY(tick)}
              y2={scaleY(tick)}
            />
            {index % LABEL_EVERY === 0 ? (
              <text className="chart__tick" x={plotLeft - 8} y={scaleY(tick) + 4} textAnchor="end">
                {tick}
              </text>
            ) : null}
          </g>
        ))}
        <line
          className="chart__axis"
          x1={plotLeft}
          x2={plotRight}
          y1={plotBottom}
          y2={plotBottom}
        />
        <line className="chart__axis" x1={plotLeft} x2={plotLeft} y1={plotTop} y2={plotBottom} />

        {drawOrder.map((name) => {
          const outline = envelopeOutline(aircraft, name, OUTLINE_FLOOR_LB);
          const points = outline
            .map((p) => `${scaleX(p.momentThousandsLbIn)},${scaleY(p.weightLb)}`)
            .join(' ');
          return (
            <polygon
              key={name}
              className={`chart__outline chart__outline--${name}${name === category ? ' chart__outline--active' : ''}`}
              points={points}
            />
          );
        })}

        <text
          className="chart__axis-title"
          x={(plotLeft + plotRight) / 2}
          y={VIEW_HEIGHT - 8}
          textAnchor="middle"
        >
          Loaded moment ÷ 1000 (lb-in)
        </text>
        <text
          className="chart__axis-title"
          transform={`translate(16 ${(plotTop + plotBottom) / 2}) rotate(-90)`}
          textAnchor="middle"
        >
          Loaded weight (lb)
        </text>

        {assessment ? (
          <>
            <line
              className="chart__flight-path"
              x1={scaleX(toMomentThousands(assessment.takeoff.loadCase.momentLbIn))}
              y1={scaleY(assessment.takeoff.loadCase.weightLb)}
              x2={scaleX(toMomentThousands(assessment.landing.loadCase.momentLbIn))}
              y2={scaleY(assessment.landing.loadCase.weightLb)}
            />
            <Marker name="Takeoff" assessment={assessment.takeoff} labelAbove />
            <Marker name="Landing" assessment={assessment.landing} labelAbove={false} />
          </>
        ) : null}
      </svg>
      <ul className="chart__legend">
        {CATEGORIES.map((name) => (
          <li key={name} className={`chart__legend-item chart__legend-item--${name}`}>
            {CATEGORY_LABELS[name]}, {formatWeightLb(aircraft.categories[name].maxWeightLb)} lb max
          </li>
        ))}
      </ul>
    </Panel>
  );
}
