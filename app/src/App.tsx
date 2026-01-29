import React, { useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { FileUploadPanel } from './components/FileUploadPanel';
import { MetricTile } from './components/MetricTile';
import { MajorInsights } from './components/MajorInsights';
import { ExportButton } from './components/ExportButton';
import { Users, User, ChevronsRight, Globe, TrendingUp } from 'lucide-react';
import {
  majorSummaryData,
  programMetricsFallback,
  summaryMetrics,
} from './constants';
import { fetchItems } from './api/items';
import type { MajorData, ProgramMetrics, SummaryMetric } from './types';

type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

const App: React.FC = () => {
  const [metrics, setMetrics] = useState<SummaryMetric[]>(summaryMetrics);
  const [majors, setMajors] = useState<MajorData[]>(majorSummaryData);
  const [programMetrics, setProgramMetrics] = useState<ProgramMetrics | null>(
    programMetricsFallback
  );
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const icons = useMemo(
    () => [
      <Users key="total" className="h-8 w-8 text-blue-500" />,
      <User key="undergrad" className="h-8 w-8 text-green-500" />,
      <ChevronsRight key="ftic" className="h-8 w-8 text-indigo-500" />,
      <TrendingUp key="transfer" className="h-8 w-8 text-amber-500" />,
      <Globe key="international" className="h-8 w-8 text-red-500" />,
    ],
    []
  );

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setStatus('loading');
      setErrorMessage(null);

      try {
        const data = await fetchItems();

        if (!isMounted) return;

        setMetrics(data.summaryMetrics ?? summaryMetrics);
        setMajors(data.majorSummaryData ?? majorSummaryData);
        setProgramMetrics(data.program_metrics ?? programMetricsFallback);
        setStatus('success');
      } catch (err) {
        if (!isMounted) return;

        setStatus('error');
        setErrorMessage(
          err instanceof Error ? err.message : 'Unable to load live data.'
        );

        // Fall back to the baked-in demo data so the dashboard stays usable.
        setMetrics(summaryMetrics);
        setMajors(majorSummaryData);
        setProgramMetrics(programMetricsFallback);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Header />
        <main className="space-y-6">
          {status === 'loading' && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Loading live enrollment data...
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Using sample data. {errorMessage ?? 'Unable to load live data.'}
            </div>
          )}

          <FileUploadPanel />

          <section>
            <h2 className="text-xl font-semibold text-slate-700 mb-4">
              Enrollment Overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {metrics.map((metric, index) => (
                <MetricTile
                  key={metric.title}
                  title={metric.title}
                  value={metric.value}
                  icon={icons[index] ?? null}
                />
              ))}
            </div>
          </section>

          <MajorInsights data={majors} programMetrics={programMetrics} />

          <div className="flex justify-end pt-4">
            <ExportButton />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
