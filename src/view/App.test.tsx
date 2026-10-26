import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from './App';

const FIELD_LABELS = {
  front: /pilot and front passenger/i,
  rear: /rear passengers/i,
  baggage: /baggage/i,
  fuel: /fuel loaded/i,
  burn: /fuel burned/i,
};

interface Loading {
  readonly front: string;
  readonly rear: string;
  readonly baggage: string;
  readonly fuel: string;
  readonly burn: string;
}

// Hand check, normal category: weight 1392 + 340 + 20 + 228 = 1980 lb,
// moment 78749.6, CG 39.77 in. Landing with 8 gal burned: 1932 lb.
const TWO_UP: Loading = { front: '340', rear: '0', baggage: '20', fuel: '38', burn: '8' };

async function enter(user: ReturnType<typeof userEvent.setup>, loading: Loading) {
  for (const [key, value] of Object.entries(loading) as [keyof Loading, string][]) {
    const field = screen.getByLabelText(FIELD_LABELS[key]);
    await user.clear(field);
    // `type` rejects an empty string, so a blank field is just left cleared.
    if (value !== '') {
      await user.type(field, value);
    }
  }
}

function phase(name: 'Takeoff' | 'Landing'): HTMLElement {
  const article = screen.getByRole('heading', { name, level: 3 }).closest('article');
  if (!article) {
    throw new Error(`No ${name} result section found`);
  }
  return article;
}

describe('App', () => {
  it('shows no results until every field is filled in', () => {
    render(<App />);

    expect(screen.getByText(/enter a value in every field/i)).toBeInTheDocument();
    expect(screen.queryByText(/within limits/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/out of limits/i)).not.toBeInTheDocument();
  });

  it('shows a result as soon as the last field is filled, not before', async () => {
    const user = userEvent.setup();
    render(<App />);

    await enter(user, { ...TWO_UP, burn: '' });
    expect(screen.queryByText(/within limits/i)).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(FIELD_LABELS.burn), '8');
    expect(within(phase('Takeoff')).getByText('Within limits')).toBeInTheDocument();
  });

  it('reports takeoff and landing figures for a loading within limits', async () => {
    const user = userEvent.setup();
    render(<App />);

    await enter(user, TWO_UP);

    const takeoff = within(phase('Takeoff'));
    expect(takeoff.getByText('Within limits')).toBeInTheDocument();
    expect(takeoff.getByText('1,980.0 lb')).toBeInTheDocument();
    expect(takeoff.getByText('39.77 in')).toBeInTheDocument();
    expect(takeoff.getByText('78.75')).toBeInTheDocument();
    expect(within(phase('Landing')).getByText('1,932.0 lb')).toBeInTheDocument();
  });

  it('flags a loading over the maximum weight and says by how much', async () => {
    const user = userEvent.setup();
    render(<App />);

    await enter(user, { ...TWO_UP, rear: '500' });

    // 1980 + 500 = 2480 lb against the 2300 lb normal maximum.
    const takeoff = within(phase('Takeoff'));
    expect(takeoff.getByText('Out of limits')).toBeInTheDocument();
    expect(takeoff.getByText(/180\.0 lb over the 2,300\.0 lb maximum/)).toBeInTheDocument();
  });

  it('labels a point that falls outside the chart axes instead of pinning it silently', async () => {
    const user = userEvent.setup();
    render(<App />);

    await enter(user, TWO_UP);
    expect(screen.queryByText(/off chart/)).not.toBeInTheDocument();

    // 2480 lb and moment 115.25 are both beyond the chart's 2400 lb and 115 limits.
    await user.clear(screen.getByLabelText(FIELD_LABELS.rear));
    await user.type(screen.getByLabelText(FIELD_LABELS.rear), '500');

    expect(screen.getByText('Takeoff, off chart')).toBeInTheDocument();
    expect(screen.getByText('Landing, off chart')).toBeInTheDocument();
  });

  it('holds back results and marks the field when what was typed is not a number', async () => {
    const user = userEvent.setup();
    render(<App />);

    await enter(user, { ...TWO_UP, baggage: '12a' });

    expect(screen.getByLabelText(FIELD_LABELS.baggage)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Enter a number such as 12 or 12.5.')).toBeInTheDocument();
    expect(screen.getByText(/fix the highlighted fields/i)).toBeInTheDocument();
    expect(screen.queryByText(/within limits/i)).not.toBeInTheDocument();
  });

  it('checks the same loading against utility limits when that category is chosen', async () => {
    const user = userEvent.setup();
    render(<App />);

    // 2180 lb is within normal limits but over the 2000 lb utility maximum.
    await enter(user, { ...TWO_UP, rear: '200' });
    expect(within(phase('Takeoff')).getByText('Within limits')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Utility' }));

    const takeoff = within(phase('Takeoff'));
    expect(takeoff.getByText('Out of limits')).toBeInTheDocument();
    expect(takeoff.getByText(/over the 2,000\.0 lb maximum/)).toBeInTheDocument();
  });

  it('flags burning more fuel than was loaded on the landing result', async () => {
    const user = userEvent.setup();
    render(<App />);

    await enter(user, { ...TWO_UP, burn: '40' });

    expect(
      within(phase('Landing')).getByText('Fuel burned is 2.0 gal more than the fuel loaded.'),
    ).toBeInTheDocument();
  });

  it('clears every field and the results', async () => {
    const user = userEvent.setup();
    render(<App />);
    await enter(user, TWO_UP);

    await user.click(screen.getByRole('button', { name: /clear all/i }));

    expect(screen.getByLabelText(FIELD_LABELS.front)).toHaveValue('');
    expect(screen.getByText(/enter a value in every field/i)).toBeInTheDocument();
  });

  it('lists the takeoff worksheet with the empty airplane figures', async () => {
    const user = userEvent.setup();
    render(<App />);

    await enter(user, TWO_UP);

    const row = screen.getByRole('row', { name: /empty airplane/i });
    expect(within(row).getByText('1,392.0')).toBeInTheDocument();
    expect(within(row).getByText('38.31')).toBeInTheDocument();
    expect(within(row).getByText('53.33')).toBeInTheDocument();
  });
});
