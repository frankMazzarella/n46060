import type { FlightAssessment, LoadCase, LoadLineId } from '../../model';
import { formatArmIn, formatMomentThousands, formatWeightLb } from '../format';
import { Panel, PanelMessage } from './Panel';
import './Worksheet.css';

const LINE_LABELS: Readonly<Record<LoadLineId, string>> = {
  empty: 'Empty airplane',
  frontSeats: 'Pilot and front passenger',
  rearSeats: 'Rear passengers',
  baggage: 'Baggage',
  fuel: 'Fuel',
};

function TotalRow({ label, loadCase }: { readonly label: string; readonly loadCase: LoadCase }) {
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>{formatWeightLb(loadCase.weightLb)}</td>
      <td>{formatArmIn(loadCase.cgIn)}</td>
      <td>{formatMomentThousands(loadCase.momentLbIn)}</td>
    </tr>
  );
}

/** The takeoff loading line by line, in the form of the handbook's weight and balance worksheet. */
export function Worksheet({ assessment }: { readonly assessment: FlightAssessment | null }) {
  return (
    <Panel title="Weight and moment">
      {assessment ? (
        <div className="worksheet">
          <table className="worksheet__table">
            <caption className="visually-hidden">
              Takeoff weight and moment by item, with takeoff and landing totals
            </caption>
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Weight (lb)</th>
                <th scope="col">Arm (in)</th>
                <th scope="col">Moment ÷ 1000</th>
              </tr>
            </thead>
            <tbody>
              {assessment.takeoff.loadCase.lines.map((line) => (
                <tr key={line.id}>
                  <th scope="row">{LINE_LABELS[line.id]}</th>
                  <td>{formatWeightLb(line.weightLb)}</td>
                  <td>{formatArmIn(line.armIn)}</td>
                  <td>{formatMomentThousands(line.momentLbIn)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <TotalRow label="Takeoff total" loadCase={assessment.takeoff.loadCase} />
              <TotalRow label="Landing total" loadCase={assessment.landing.loadCase} />
            </tfoot>
          </table>
          <p className="worksheet__note">The arm shown for a total is the CG.</p>
        </div>
      ) : (
        <PanelMessage>The worksheet appears once every field is filled in.</PanelMessage>
      )}
    </Panel>
  );
}
