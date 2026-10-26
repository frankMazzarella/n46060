import { useWeightBalance } from '../controller';
import { N46060 } from '../model';
import { Disclaimer } from './components/Disclaimer';
import { EnvelopeChart } from './components/EnvelopeChart';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { LoadForm } from './components/LoadForm';
import { ResultsPanel } from './components/ResultsPanel';
import { Worksheet } from './components/Worksheet';
import { describeEmptyOverride, describePending } from './messages';

function Calculator() {
  const {
    form,
    parsed,
    assessment,
    emptyOverridden,
    setField,
    slideEmptyWeight,
    setCategory,
    clear,
  } = useWeightBalance(N46060);

  return (
    <div className="app">
      <Header aircraft={N46060} category={form.category} onCategoryChange={setCategory} />
      <Disclaimer />
      <main className="dashboard">
        <LoadForm
          aircraft={N46060}
          values={form.values}
          parsed={parsed}
          emptyOverridden={emptyOverridden}
          onFieldChange={setField}
          onSlideEmptyWeight={slideEmptyWeight}
          onClear={clear}
        />
        <EnvelopeChart aircraft={N46060} category={form.category} assessment={assessment} />
        <ResultsPanel
          category={form.category}
          assessment={assessment}
          pendingMessage={parsed.status === 'ready' ? null : describePending(parsed)}
          notice={emptyOverridden ? describeEmptyOverride(N46060) : null}
        />
        <Worksheet assessment={assessment} />
      </main>
    </div>
  );
}

/**
 * The error boundary sits above the calculator, not inside it, because the
 * model throws while the calculator renders and a boundary only catches errors
 * from the components beneath it.
 */
export function App() {
  return (
    <ErrorBoundary>
      <Calculator />
    </ErrorBoundary>
  );
}
